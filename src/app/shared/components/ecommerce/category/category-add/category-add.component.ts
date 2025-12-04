import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { SwitchComponent } from '../../../form/input/switch.component';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/api/category.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FileService } from '../../../../services/api/file.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../../environments/environment';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { buildTreeOptions, TreeOption } from '../../../../utils/tree-utils';
import { ImageUploadComponent } from '../../../_core/image-upload/image-upload.component';

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  parent: string | null;
}

@Component({
  selector: 'app-category-add',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgSelectModule,
    LabelComponent,
    InputFieldComponent,
    TextAreaComponent,
    ButtonComponent,
    SwitchComponent,
    ImageUploadComponent,
  ],
  templateUrl: './category-add.component.html',
  styles: [``],
})
export class CategoryAddComponent implements OnInit {
  categoryForm: CategoryFormData = {
    name: '',
    description: '',
    image: '',
    isActive: true,
    parent: null,
  };

  parentCategories: TreeOption[] = [];
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  categoryId: string | null = null;
  isEditMode: boolean = false;

  constructor(
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fileService: FileService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    this.loadParentCategories();

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.categoryId = id;
        this.loadCategory(id);
      }
    });
  }

  loadParentCategories() {
    this.categoryService.getAll({ limit: 1000 }).subscribe((data) => {
      if (data?.results?.length) {
        data.results = data.results.filter((el) => el.id !== this.categoryId);
        this.parentCategories = buildTreeOptions(data.results);
        console.log('parentCategories', this.parentCategories);
      }
    });
  }

  loadCategory(id: string) {
    this.categoryService.getById(id).subscribe({
      next: (data) => {
        this.categoryForm = {
          name: data.name,
          description: data.description || '',
          image: data.image || '',
          isActive: data.isActive,
          parent: data.parent || null,
        };
        if (data.image) {
          this.imagePreview = `${environment.urlBaseImage}${data.image}`;
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load category data', 'Error');
      },
    });
  }

  updateField(field: keyof CategoryFormData, value: any) {
    if (field === 'parent') {
      this.categoryForm[field] = value || null;
    } else {
      (this.categoryForm as any)[field] = value;
    }
  }

  toggleActive() {
    this.categoryForm.isActive = !this.categoryForm.isActive;
  }

  onFileSelected(file: File) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload lên server
    this.fileService.uploadFile(file).subscribe({
      next: (res) => (this.categoryForm.image = res.url),
      error: (err) => {
        console.error(err);
        this.toastr.error('Upload failed!', 'Image');
      },
    });
  }

  validateForm(): boolean {
    if (!this.categoryForm.name.trim()) {
      this.toastr.warning('Category name is required!', 'Validation');
      return false;
    }
    return true;
  }

  onSave() {
    if (!this.validateForm()) return;

    const categoryData: Partial<Category> = {
      name: this.categoryForm.name,
      description: this.categoryForm.description || undefined,
      image: this.categoryForm.image || undefined,
      isActive: this.categoryForm.isActive,
      parent: this.categoryForm.parent,
    };

    const obs =
      this.isEditMode && this.categoryId
        ? this.categoryService.update(this.categoryId, categoryData)
        : this.categoryService.create(categoryData);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Updated successfully!' : 'Created successfully!',
          'Category',
        );
        this.router.navigateByUrl('/category');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.isEditMode ? 'Update failed!' : 'Create failed!', 'Category');
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/category');
  }
}
