import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { ProductService } from '../../../../services/api/product.service';

import { Product } from '../../../../models/product.model';
import {
  ComboItem,
  ComboSelectableProduct,
  ComboFormData,
  ComboPricingMode,
  DiscountType, // MỚI
} from '../../../../models/combo.model';
import { ComboService } from '../../../../services/api/combo.service';
import { ToastrService } from 'ngx-toastr';
import { FileService } from '../../../../services/api/file.service';

import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';
import { environment } from '../../../../../../environments/environment';
import { ImageUploadComponent } from '../../../_core/image-upload/image-upload.component';
import { SwitchComponent } from '../../../form/input/switch.component';
import { DialogService } from '@ngneat/dialog';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';

/**
 * MỚI: Hàm helper để tạo chuỗi YYYY-MM-DDTHH:mm
 * (Input 'datetime-local' yêu cầu định dạng này)
 */
const formatDateToInput = (date: Date): string => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

// --- CẬP NHẬT DEFAULT_COMBO ---
const DEFAULT_COMBO: ComboFormData = {
  name: '',
  description: '',
  image: '',
  startDate: formatDateToInput(new Date()), // Cập nhật (datetime-local)
  endDate: formatDateToInput(new Date()), // Cập nhật (datetime-local)
  items: [],
  isActive: true,
  priority: 0,
  pricingMode: ComboPricingMode.FIXED,
  comboPrice: 0,
  discountType: DiscountType.NONE,
  discountValue: 0,
};

@Component({
  selector: 'app-combo-add',
  templateUrl: './combo-add.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    ImageUploadComponent,
    SwitchComponent,
    NgSelectModule,
  ],
})
export class ComboAddComponent implements OnInit {
  @ViewChild('confirmDeleteTpl') confirmDeleteTpl!: TemplateRef<any>;

  public pricingModes = ComboPricingMode;
  public discountTypes = DiscountType; // MỚI
  public pricingModeOptions = [
    { value: ComboPricingMode.FIXED, label: 'MODE: Fixed Price (e.g., KFC, Lotteria)' },
    { value: ComboPricingMode.SLOT_PRICE, label: 'MODE: Slot-Based Price (e.g., Subway)' },
    { value: ComboPricingMode.DISCOUNT, label: 'MODE: Discount % or Amount (e.g., GrabFood)' },
  ];

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
    private dialog: DialogService,
  ) {}

  ngOnInit(): void {
    this.comboId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.comboId;

    this.loadAvailableProducts();

    if (this.isEditMode && this.comboId) {
      this.loadComboData(this.comboId);
    } else {
      this.expandedItems.add(0);
    }
  }

  private loadAvailableProducts(): void {
    this.productService.getAll({ limit: 1000, isActive: true }).subscribe((rs) => {
      this.availableProducts = rs.results;
    });
  }

  private loadComboData(id: string): void {
    this.comboService.getById(id).subscribe((combo) => {
      this.comboData = {
        ...DEFAULT_COMBO,
        ...combo,
        items: combo.items.map((item) => ({
          ...item,
          minSelection: item.minSelection,
          maxSelection: item.maxSelection,
          selectableProducts: item.selectableProducts.map((p) => ({
            ...p,
            additionalPrice: p.additionalPrice || 0,
            slotPrice: p.slotPrice || p.snapshotPrice || 0,
          })),
        })),
        // Cập nhật (datetime-local)
        startDate: combo.startDate ? formatDateToInput(new Date(combo.startDate)) : '',
        endDate: combo.endDate ? formatDateToInput(new Date(combo.endDate)) : '',
      };
      if (combo.image) this.imagePreview = `${environment.urlBaseImage}${combo.image}`;

      // (Logic set discountType khi load)
      if (this.comboData.pricingMode === ComboPricingMode.DISCOUNT) {
        if (combo.discountType === DiscountType.AMOUNT && combo.discountValue > 0) {
          this.comboData.discountType = DiscountType.AMOUNT;
        } else {
          // Mặc định là PERCENT nếu là DISCOUNT mode
          this.comboData.discountType = DiscountType.PERCENT;
        }
      }

      this.comboData.items.forEach((_, index) => {
        this.expandedItems.add(index);
      });
    });
  }

  handlePricingModeChange(newMode: any) {
    this.comboData.pricingMode = newMode;

    if (newMode === ComboPricingMode.DISCOUNT) {
      this.comboData.discountType = DiscountType.PERCENT;
      this.comboData.discountValue = 0;
    } else {
      this.comboData.discountType = DiscountType.NONE;
      this.comboData.discountValue = 0;
    }
  }

  handleDiscountTypeChange(newType: DiscountType) {
    this.comboData.discountType = newType;
    this.comboData.discountValue = 0;
  }

  handleFieldChange(field: keyof ComboFormData, value: any): void {
    if (field === 'isActive') {
      (this.comboData as any)[field] = value === 'true';
    } else {
      (this.comboData as any)[field] = value;
    }
  }

  addComboItem(): void {
    const newItem: ComboItem = {
      slotName: '',
      selectableProducts: [],
      minSelection: 1,
      maxSelection: 1,
    };
    this.comboData.items.push(newItem);
    this.expandedItems.add(this.comboData.items.length - 1);
  }

  removeComboItem(index: number): void {
    const slotName = this.comboData.items[index]?.slotName || `Unnamed Group ${index + 1}`;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {
        slotName: slotName,
      },
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.comboData.items.splice(index, 1);
        this.expandedItems.delete(index);
        const newExpanded = new Set<number>();
        this.expandedItems.forEach((i) => {
          if (i > index) newExpanded.add(i - 1);
          else if (i < index) newExpanded.add(i);
        });
        this.expandedItems = newExpanded;
        this.toastr.success('Item group removed successfully!', 'Combo');
      }
    });
  }

  moveItemUp(index: number): void {
    if (index > 0) {
      [this.comboData.items[index], this.comboData.items[index - 1]] = [
        this.comboData.items[index - 1],
        this.comboData.items[index],
      ];
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
    if (field === 'minSelection' || field === 'maxSelection') {
      value = +value;
    }
    (this.comboData.items[itemIndex] as any)[field] = value;
  }

  addSelectableProduct(itemIndex: number): void {
    const newProduct: ComboSelectableProduct = {
      product: '',
      snapshotPrice: 0,
      additionalPrice: 0,
      slotPrice: 0,
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

    if (field === 'additionalPrice' || field === 'slotPrice') {
      value = +value;
    }

    (product as any)[field] = value;

    if (field === 'product' && value) {
      const selectedProduct = this.availableProducts.find((p) => p.id === value);
      if (selectedProduct) {
        product.snapshotPrice = +selectedProduct.basePrice;
        product.slotPrice = +selectedProduct.basePrice;
        product.additionalPrice = 0;
      }
    }
  }

  onFileSelected(file: File) {
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    this.fileService.uploadFile(file).subscribe({
      next: (res) => (this.comboData.image = res.url),
      error: (err) => {
        console.error(err);
        this.toastr.error('Upload failed!', 'Image');
      },
    });
  }

  calculateTotalValue(): number {
    return this.comboData.items.reduce((total, item) => {
      if (item.minSelection > 0 && item.selectableProducts.length > 0) {
        const sortedProducts = [...item.selectableProducts].sort(
          (a, b) => a.snapshotPrice - b.snapshotPrice,
        );
        const cheapestItems = sortedProducts.slice(0, item.minSelection);
        const itemTotal = cheapestItems.reduce((sum, product) => sum + product.snapshotPrice, 0);
        return total + itemTotal;
      }
      return total;
    }, 0);
  }

  getSelectionRuleText(item: ComboItem): string {
    if (item.minSelection < 0 || item.maxSelection < 0 || item.maxSelection < item.minSelection) {
      return 'Quy tắc không hợp lệ';
    }
    if (item.minSelection === 0) {
      if (item.maxSelection === 0) return 'Không thể chọn';
      return `Chọn tối đa ${item.maxSelection} món`;
    }
    if (item.minSelection === item.maxSelection) {
      return `Chọn đúng ${item.minSelection} món`;
    }
    return `Chọn từ ${item.minSelection} đến ${item.maxSelection} món`;
  }

  validateCombo(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { pricingMode, comboPrice, discountType, discountValue, items } = this.comboData;

    if (!this.comboData.name.trim()) {
      errors.push('Combo name is required');
    }
    if (new Date(this.comboData.startDate) > new Date(this.comboData.endDate)) {
      errors.push('End date must be after start date');
    }
    if (items.length === 0) {
      errors.push('At least one combo item (group) is required');
    }

    if (pricingMode === ComboPricingMode.FIXED) {
      if (comboPrice <= 0) {
        errors.push('FIXED mode requires a "Combo Price" greater than 0');
      }
    } else if (pricingMode === ComboPricingMode.DISCOUNT) {
      if (discountType === DiscountType.NONE || !discountType) {
        errors.push('DISCOUNT mode requires a "Discount Type" (Percent or Amount)');
      }
      if (discountValue <= 0) {
        errors.push('DISCOUNT mode requires a "Discount Value" greater than 0');
      }
    }

    items.forEach((item, index) => {
      if (!item.slotName.trim()) {
        errors.push(`Nhóm ${index + 1}: Tên nhóm là bắt buộc`);
      }
      if (item.selectableProducts.length === 0) {
        errors.push(`Nhóm ${index + 1}: Phải có ít nhất 1 sản phẩm để chọn`);
      }
      if (item.minSelection < 0 || item.maxSelection < 0) {
        errors.push(`Nhóm ${index + 1}: Số lượng chọn tối thiểu/tối đa không hợp lệ`);
      }
      if (item.maxSelection < item.minSelection) {
        errors.push(`Nhóm ${index + 1}: Số lượng tối đa không thể nhỏ hơn tối thiểu`);
      }
      if (
        item.minSelection > item.selectableProducts.length &&
        item.selectableProducts.length > 0
      ) {
        errors.push(
          `Nhóm ${index + 1}: Yêu cầu chọn ${item.minSelection} nhưng chỉ có ${item.selectableProducts.length} sản phẩm`,
        );
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  onPublish() {
    const validation = this.validateCombo();
    if (!validation.isValid) {
      this.toastr.error(validation.errors.join('<br>'), 'Validation Failed', {
        enableHtml: true,
      });
      return;
    }

    const payload: ComboFormData = JSON.parse(JSON.stringify(this.comboData));

    // Logic reset payload
    if (payload.pricingMode === ComboPricingMode.FIXED) {
      payload.discountType = DiscountType.NONE;
      payload.discountValue = 0;
    } else if (payload.pricingMode === ComboPricingMode.SLOT_PRICE) {
      payload.comboPrice = 0;
      payload.discountType = DiscountType.NONE;
      payload.discountValue = 0;
    } else if (payload.pricingMode === ComboPricingMode.DISCOUNT) {
      payload.comboPrice = 0;
    }

    const validKeys = Object.keys(DEFAULT_COMBO) as (keyof ComboFormData)[];
    const sanitized = sanitizeFormData<ComboFormData>(payload, validKeys);

    // Cập nhật (datetime-local)
    // Chỉ cần chuyển đổi về Date object, không cần setHours
    if (sanitized.startDate) {
      sanitized.startDate = new Date(sanitized.startDate);
    }
    if (sanitized.endDate) {
      sanitized.endDate = new Date(sanitized.endDate);
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
        this.toastr.error(err?.error?.message || 'Update failed!', 'Combo');
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
