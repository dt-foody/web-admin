import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColorSketchModule } from 'ngx-color/sketch';
import { ColorEvent } from 'ngx-color';

// Core and shared components
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ButtonComponent } from '../../../ui/button/button.component';

// Models and Services
import { BlogCategory } from '../../../../models/blog-category.model';
import { BlogCategoryService } from '../../../../services/api/blog-category.service';
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';
import { ImageUploadComponent } from '../../../_core/image-upload/image-upload.component';
import { FileService } from '../../../../services/api/file.service';
import { SwitchComponent } from '../../../form/input/switch.component';
import { environment } from '../../../../../../environments/environment';

interface BlogCategoryFormData {
  name: string;
  description: string;
  coverImage: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
  priority: number;
}

const DEFAULT_FORM: BlogCategoryFormData = {
  name: '',
  description: '',
  coverImage: '',
  backgroundColor: '#E0E0E0',
  textColor: '#212121',
  isActive: true,
  priority: 0,
};

@Component({
  selector: 'app-blog-category-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent,
    ButtonComponent,
    ColorSketchModule,
    ImageUploadComponent,
    SwitchComponent,
  ],
  templateUrl: './blog-category-add.component.html',
})
export class BlogCategoryAddComponent implements OnInit {
  categoryId: string | null = null;
  isEditMode: boolean = false;

  imagePreview: string | null = null;
  selectedFile: File | null = null;

  formData = createFormData(DEFAULT_FORM);

  activePicker: 'bg' | 'text' | null = null;

  constructor(
    private blogCategoryService: BlogCategoryService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fileService: FileService,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.categoryId = id;
        this.loadCategory(id);
      }
    });
  }

  loadCategory(id: string) {
    this.blogCategoryService.getById(id).subscribe({
      next: (data: BlogCategory) => {
        this.formData = {
          name: data.name || '',
          description: data.description || '',
          coverImage: data.coverImage || '',
          backgroundColor: data.backgroundColor || DEFAULT_FORM.backgroundColor,
          textColor: data.textColor || DEFAULT_FORM.textColor,
          isActive: data.isActive !== undefined ? data.isActive : true,
          priority: data.priority || 0,
        };
        if (data.coverImage) {
          this.imagePreview = `${environment.urlBaseImage}${data.coverImage}`;
        }
      },
      error: (err) => {
        this.toastr.error('Cannot load category data', 'Error');
        this.router.navigateByUrl('/blog/categories');
      },
    });
  }

  onNameChange(newName: any) {
    this.formData.name = newName;
  }

  togglePicker(picker: 'bg' | 'text') {
    this.activePicker = this.activePicker === picker ? null : picker;
  }

  onColorChange(field: 'backgroundColor' | 'textColor', event: ColorEvent) {
    if (event && event.color && event.color.hex) {
      this.formData[field] = event.color.hex;
    }
  }

  validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.toastr.error('Category name is required', 'Validation');
      return false;
    }
    return true;
  }

  onSave() {
    if (!this.validateForm()) return;

    const sanitized = deepSanitize(this.formData, DEFAULT_FORM);
    const obs =
      this.isEditMode && this.categoryId
        ? this.blogCategoryService.update(this.categoryId, sanitized)
        : this.blogCategoryService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Category updated successfully!' : 'Category created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/blog-category');
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Operation failed!', 'Error');
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/blog-category');
  }

  onFileSelected(file: File) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload lên server
    this.fileService.uploadFile(file).subscribe({
      next: (res) => (this.formData.coverImage = res.url),
      error: (err) => {
        console.error(err);
        this.toastr.error('Upload failed!', 'Image');
      },
    });
  }
}
