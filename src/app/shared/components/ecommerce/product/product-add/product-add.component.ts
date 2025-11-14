import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import {
  Product,
  ProductOption,
  ProductOptionGroup,
  ProductFormData,
} from '../../../../models/product.model';
import { ProductService } from '../../../../services/api/product.service';
import { ToastrService } from 'ngx-toastr';
import { FileService } from '../../../../services/api/file.service';
import { CategoryService } from '../../../../services/api/category.service';
import { buildTreeOptions, TreeOption } from '../../../../utils/tree-utils';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../../environments/environment';

import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';
import { ImageUploadComponent } from '../../../_core/image-upload/image-upload.component';
import { SwitchComponent } from '../../../form/input/switch.component';

const DEFAULT_FORM: ProductFormData = {
  name: '',
  description: '',
  basePrice: 0,
  category: null,
  image: '',
  isActive: true,
  priority: 0,
  optionGroups: [],
};

@Component({
  selector: 'app-product-add',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    ImageUploadComponent,
    SwitchComponent,
  ],
  templateUrl: './product-add.component.html',
  styles: ``,
})
export class ProductAddComponent implements OnInit {
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  productId: string | null = null;
  isEditMode: boolean = false;

  // Dữ liệu form
  productData = createFormData(DEFAULT_FORM);

  categories: TreeOption[] = [];

  priceModifierTypes = [
    { value: 'fixed_amount', label: 'Fixed Amount' },
    { value: 'percentage', label: 'Percentage' },
  ];

  // Trạng thái UI
  expandedGroups: Set<number> = new Set();

  constructor(
    private productService: ProductService,
    private toastr: ToastrService,
    private fileService: FileService,
    private categoryService: CategoryService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadCategories();

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.productId = id;
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: string) {
    this.productService.getById(id).subscribe({
      next: (data: any) => {
        this.productData = { ...data };
        if (data.image) this.imagePreview = `${environment.urlBaseImage}${data.image}`;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load product data', 'Error');
      },
    });
  }

  loadCategories() {
    this.categoryService.getAll({ limit: 1000 }).subscribe((data) => {
      if (data?.results?.length) {
        this.categories = buildTreeOptions(data.results);
        console.log('categories', this.categories);
      }
    });
  }

  // Toggle mở/đóng option group
  toggleGroup(index: number) {
    if (this.expandedGroups.has(index)) {
      this.expandedGroups.delete(index);
    } else {
      this.expandedGroups.add(index);
    }
  }

  isGroupExpanded(index: number): boolean {
    return this.expandedGroups.has(index);
  }

  // Thêm Option Group mới
  addOptionGroup() {
    this.productData.optionGroups.push({
      name: '',
      minOptions: 0,
      maxOptions: 1,
      priority: this.productData.optionGroups.length,
      options: [],
    });
    // Tự động mở group vừa thêm
    this.expandedGroups.add(this.productData.optionGroups.length - 1);
  }

  // Xóa Option Group
  removeOptionGroup(index: number) {
    this.productData.optionGroups.splice(index, 1);
    this.expandedGroups.delete(index);
    // Cập nhật lại priority
    this.productData.optionGroups.forEach((group: any, idx: number) => {
      group.priority = idx;
    });
  }

  // Thêm Option vào Group
  addOption(groupIndex: number) {
    const group = this.productData.optionGroups[groupIndex];
    group.options.push({
      name: '',
      priceModifier: 0,
      type: 'fixed_amount',
      isActive: true,
      priority: group.options.length,
    });
  }

  // Xóa Option khỏi Group
  removeOption(groupIndex: number, optionIndex: number) {
    const group = this.productData.optionGroups[groupIndex];
    group.options.splice(optionIndex, 1);
    // Cập nhật lại priority
    group.options.forEach((option: any, idx: number) => {
      option.priority = idx;
    });
  }

  // Di chuyển Option Group lên
  moveGroupUp(index: number) {
    if (index > 0) {
      const temp = this.productData.optionGroups[index];
      this.productData.optionGroups[index] = this.productData.optionGroups[index - 1];
      this.productData.optionGroups[index - 1] = temp;
      // Cập nhật priority
      this.productData.optionGroups.forEach((group: any, idx: number) => {
        group.priority = idx;
      });
    }
  }

  // Di chuyển Option Group xuống
  moveGroupDown(index: number) {
    if (index < this.productData.optionGroups.length - 1) {
      const temp = this.productData.optionGroups[index];
      this.productData.optionGroups[index] = this.productData.optionGroups[index + 1];
      this.productData.optionGroups[index + 1] = temp;
      // Cập nhật priority
      this.productData.optionGroups.forEach((group: any, idx: number) => {
        group.priority = idx;
      });
    }
  }

  handleSelectChange(field: keyof ProductFormData, value: string) {
    if (field === 'isActive') {
      this.productData[field] = value === 'true';
    } else {
      (this.productData as any)[field] = value;
    }
  }

  handleGroupFieldChange(
    groupIndex: number,
    field: keyof ProductOptionGroup,
    value: string | number,
  ) {
    const group = this.productData.optionGroups[groupIndex];
    if (field === 'minOptions' || field === 'maxOptions' || field === 'priority') {
      (group as any)[field] = typeof value === 'string' ? parseInt(value) || 0 : value;
    } else {
      (group as any)[field] = value;
    }
  }

  // Validate form
  validateForm(): boolean {
    if (!this.productData.name.trim()) {
      alert('Product name is required');
      return false;
    }
    if (!this.productData.category) {
      alert('Please select a category');
      return false;
    }
    if (this.productData.basePrice <= 0) {
      alert('Base price must be greater than 0');
      return false;
    }

    // Validate option groups
    for (let i = 0; i < this.productData.optionGroups.length; i++) {
      const group = this.productData.optionGroups[i];
      if (!group.name.trim()) {
        alert(`Option group ${i + 1} needs a name`);
        return false;
      }
      if (group.maxOptions < group.minOptions) {
        alert(`In group "${group.name}", max options cannot be less than min options`);
        return false;
      }
      if (group.options.length === 0) {
        alert(`Option group "${group.name}" must have at least one option`);
        return false;
      }

      // Validate options in group
      for (let j = 0; j < group.options.length; j++) {
        const option = group.options[j];
        if (!option.name.trim()) {
          alert(`Option ${j + 1} in group "${group.name}" needs a name`);
          return false;
        }
      }
    }

    return true;
  }

  // Submit handlers
  onDraft() {
    console.log('Draft saved:', this.productData);
    alert('Product saved as draft');
  }

  onPublish() {
    if (!this.validateForm()) return;

    const validKeys = Object.keys(DEFAULT_FORM) as (keyof ProductFormData)[];
    const sanitized = sanitizeFormData<ProductFormData>(this.productData, validKeys);

    const obs =
      this.isEditMode && this.productId
        ? this.productService.update(this.productId, sanitized)
        : this.productService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Updated successfully!' : 'Created successfully!',
          'Product',
        );
        this.router.navigateByUrl('/product');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.isEditMode ? 'Update failed!' : 'Create failed!', 'Product');
      },
    });
  }

  onFileSelected(file: File) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload lên server
    this.fileService.uploadFile(file).subscribe({
      next: (res) => (this.productData.image = res.url),
      error: (err) => {
        console.error(err);
        this.toastr.error('Upload failed!', 'Image');
      },
    });
  }
}
