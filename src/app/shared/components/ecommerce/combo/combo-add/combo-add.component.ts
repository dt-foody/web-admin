import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { ProductService } from '../../../../services/api/product.service';

import { Product } from '../../../../models/product.model';
import { ComboItem, ComboSelectableProduct, ComboFormData } from '../../../../models/combo.model';
import { ComboService } from '../../../../services/api/combo.service';
import { ToastrService } from 'ngx-toastr';
import { FileService } from '../../../../services/api/file.service';

import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';
import { environment } from '../../../../../../environments/environment';
import { ImageUploadComponent } from '../../../_core/image-upload/image-upload.component';
import { SwitchComponent } from '../../../form/input/switch.component';

const DEFAULT_COMBO: ComboFormData = {
  name: '',
  description: '',
  comboPrice: 0,
  thumbnailUrl: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
  items: [],
  isActive: true,
  priority: 0,
};

@Component({
  selector: 'app-combo-add',
  templateUrl: './combo-add.component.html',
  standalone: true,
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    ImageUploadComponent,
    SwitchComponent,
  ],
})
export class ComboAddComponent implements OnInit {
  comboData = createFormData(DEFAULT_COMBO);

  availableProducts: Product[] = [];

  expandedItems: Set<number> = new Set();
  isEditMode = false;
  comboId: string | null = null;

  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private comboService: ComboService,
    private toastr: ToastrService,
    private fileService: FileService,
  ) {}

  ngOnInit(): void {
    this.comboId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.comboId;

    this.loadAvailableProducts();

    if (this.isEditMode && this.comboId) {
      this.loadComboData(this.comboId);
    } else {
      // Expand first item by default for new combo
      this.expandedItems.add(0);
    }
  }

  private loadAvailableProducts(): void {
    this.productService.getAll({ limit: 1000, isActive: true }).subscribe((rs) => {
      this.availableProducts = rs.results;
    });
  }

  private loadComboData(id: string): void {
    // TODO: Replace with actual API call
    this.comboService.getById(id).subscribe((combo) => {
      this.comboData = {
        ...combo,
        startDate: combo.startDate ? new Date(combo.startDate).toISOString().split('T')[0] : '',
        endDate: combo.endDate ? new Date(combo.endDate).toISOString().split('T')[0] : '',
      };
      if (combo.thumbnailUrl)
        this.imagePreview = `${environment.urlBaseImage}${combo.thumbnailUrl}`;

      // Expand all items in edit mode
      this.comboData.items.forEach((_, index) => {
        this.expandedItems.add(index);
      });
    });
  }

  handleSelectChange(field: keyof ComboFormData, value: string): void {
    if (field === 'isActive') {
      this.comboData[field] = value === 'true';
    } else {
      (this.comboData as any)[field] = value;
    }
  }

  addComboItem(): void {
    const newItem: ComboItem = {
      slotName: '',
      selectableProducts: [],
      isRequired: true,
    };
    this.comboData.items.push(newItem);
    // Auto expand the newly added item
    this.expandedItems.add(this.comboData.items.length - 1);
  }

  removeComboItem(index: number): void {
    if (confirm('Are you sure you want to remove this combo item?')) {
      this.comboData.items.splice(index, 1);
      this.expandedItems.delete(index);
      // Reindex expanded items
      const newExpanded = new Set<number>();
      this.expandedItems.forEach((i) => {
        if (i > index) newExpanded.add(i - 1);
        else if (i < index) newExpanded.add(i);
      });
      this.expandedItems = newExpanded;
    }
  }

  moveItemUp(index: number): void {
    if (index > 0) {
      [this.comboData.items[index], this.comboData.items[index - 1]] = [
        this.comboData.items[index - 1],
        this.comboData.items[index],
      ];

      // Update expanded state
      const wasCurrentExpanded = this.expandedItems.has(index);
      const wasPrevExpanded = this.expandedItems.has(index - 1);

      this.expandedItems.delete(index);
      this.expandedItems.delete(index - 1);

      if (wasCurrentExpanded) this.expandedItems.add(index - 1);
      if (wasPrevExpanded) this.expandedItems.add(index);
    }
  }

  moveItemDown(index: number): void {
    if (index < this.comboData.items.length - 1) {
      [this.comboData.items[index], this.comboData.items[index + 1]] = [
        this.comboData.items[index + 1],
        this.comboData.items[index],
      ];

      // Update expanded state
      const wasCurrentExpanded = this.expandedItems.has(index);
      const wasNextExpanded = this.expandedItems.has(index + 1);

      this.expandedItems.delete(index);
      this.expandedItems.delete(index + 1);

      if (wasCurrentExpanded) this.expandedItems.add(index + 1);
      if (wasNextExpanded) this.expandedItems.add(index);
    }
  }

  toggleItem(index: number): void {
    if (this.expandedItems.has(index)) {
      this.expandedItems.delete(index);
    } else {
      this.expandedItems.add(index);
    }
  }

  isItemExpanded(index: number): boolean {
    return this.expandedItems.has(index);
  }

  handleItemFieldChange(itemIndex: number, field: keyof ComboItem, value: any): void {
    (this.comboData.items[itemIndex] as any)[field] = value;
  }

  addSelectableProduct(itemIndex: number): void {
    const newProduct: ComboSelectableProduct = {
      product: '',
      fixedPrice: 0,
      maxQuantity: 1,
    };
    this.comboData.items[itemIndex].selectableProducts.push(newProduct);
  }

  removeSelectableProduct(itemIndex: number, productIndex: number): void {
    this.comboData.items[itemIndex].selectableProducts.splice(productIndex, 1);
  }

  handleProductFieldChange(
    itemIndex: number,
    productIndex: number,
    field: keyof ComboSelectableProduct,
    value: any,
  ): void {
    const product = this.comboData.items[itemIndex].selectableProducts[productIndex];
    (product as any)[field] = value;

    // Auto-fill price when product is selected
    if (field === 'product' && value) {
      const selectedProduct = this.availableProducts.find((p) => p.id === value);
      if (selectedProduct) {
        product.fixedPrice = +selectedProduct.basePrice;
      }
    }
  }

  onFileSelected(file: File) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload lên server
    this.fileService.uploadFile(file).subscribe({
      next: (res) => (this.comboData.thumbnailUrl = res.url),
      error: (err) => {
        console.error(err);
        this.toastr.error('Upload failed!', 'Image');
      },
    });
  }

  calculateTotalValue(): number {
    return this.comboData.items.reduce((total, item) => {
      const itemTotal = item.selectableProducts.reduce((sum, product) => {
        return sum + product.fixedPrice * product.maxQuantity;
      }, 0);
      return total + (item.isRequired ? itemTotal : 0);
    }, 0);
  }

  validateCombo(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.comboData.name.trim()) {
      errors.push('Combo name is required');
    }

    if (this.comboData.comboPrice <= 0) {
      errors.push('Combo price must be greater than 0');
    }

    if (new Date(this.comboData.startDate) > new Date(this.comboData.endDate)) {
      errors.push('End date must be after start date');
    }

    if (this.comboData.items.length === 0) {
      errors.push('At least one combo item is required');
    }

    this.comboData.items.forEach((item, index) => {
      if (!item.slotName.trim()) {
        errors.push(`Item ${index + 1}: Slot name is required`);
      }
      if (item.selectableProducts.length === 0) {
        errors.push(`Item ${index + 1}: At least one product is required`);
      }
      item.selectableProducts.forEach((product, pIndex) => {
        if (!product.product) {
          errors.push(`Item ${index + 1}, Product ${pIndex + 1}: Product selection is required`);
        }
        if (product.fixedPrice < 0) {
          errors.push(`Item ${index + 1}, Product ${pIndex + 1}: Price cannot be negative`);
        }
      });
    });

    return { isValid: errors.length === 0, errors };
  }

  onPublish() {
    if (!this.validateCombo()) return;

    const validKeys = Object.keys(DEFAULT_COMBO) as (keyof ComboFormData)[];
    const sanitized = sanitizeFormData<ComboFormData>(this.comboData, validKeys);

    if (sanitized.startDate) {
      sanitized.startDate = new Date(new Date(sanitized.startDate).setHours(0, 0, 0));
      sanitized.endDate = new Date(new Date(sanitized.endDate).setHours(23, 59, 59));
    }

    const obs =
      this.isEditMode && this.comboId
        ? this.comboService.update(this.comboId, sanitized)
        : this.comboService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Updated successfully!' : 'Created successfully!',
          'Combo',
        );
        this.router.navigateByUrl('/combo');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.isEditMode ? 'Update failed!' : 'Create failed!', 'Combo');
      },
    });
  }

  getProductOptions(): Array<{ value: string; label: string }> {
    return this.availableProducts.map((p) => ({
      value: p.id,
      label: `${p.name} (${p.basePrice.toLocaleString()} VND)`,
    }));
  }
}
