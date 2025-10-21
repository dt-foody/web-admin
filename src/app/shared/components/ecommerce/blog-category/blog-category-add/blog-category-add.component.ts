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
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';

// Models and Services
import { BlogCategory } from '../../../../models/blog-category.model';
import { BlogCategoryService } from '../../../../services/api/blog-category.service';
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';

interface BlogCategoryFormData {
  name: string;
  description: string;
  coverImage: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

const DEFAULT_FORM: BlogCategoryFormData = {
  name: '',
  description: '',
  coverImage: '',
  backgroundColor: '#E0E0E0',
  textColor: '#212121',
  isActive: true,
};

@Component({
  selector: 'app-blog-category-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
    ColorSketchModule,
  ],
  templateUrl: './blog-category-add.component.html',
})
export class BlogCategoryAddComponent implements OnInit {
  categoryId: string | null = null;
  isEditMode: boolean = false;

  formData = createFormData(DEFAULT_FORM);

  statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  activePicker: 'bg' | 'text' | null = null;

  constructor(
    private blogCategoryService: BlogCategoryService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
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
        };
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
}
