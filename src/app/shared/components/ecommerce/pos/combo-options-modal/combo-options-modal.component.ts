import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

import {
  Combo,
  ComboItem,
  ComboSelectableProduct,
  ComboPricingMode,
} from '../../../../models/combo.model';
import { OrderItemComboSelection, OrderItemOption } from '../../../../models/order.model';
import { ComboWithOptionsResult } from '../../../../services/api/pos.service';
import { ProductOption, ProductOptionGroup } from '../../../../models/product.model';

// Interface lưu món đã chọn
interface SelectedComboItem {
  originalData: ComboSelectableProduct;
  selectedOptions: OrderItemOption[];
  optionsPrice: number;
}

@Component({
  selector: 'app-combo-options-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combo-options-modal.component.html',
})
export class ComboOptionsModalComponent {
  public combo: Combo;
  public note: string = '';

  // State lưu các món đã chọn vào giỏ
  public selectedItems: Record<string, SelectedComboItem[]> = {};

  // --- STATE MỚI CHO VIỆC CẤU HÌNH OPTION TẠI CHỖ ---
  // Biến này xác định xem có đang ở màn hình chọn Option không
  public configuringItem: { slot: ComboItem; product: ComboSelectableProduct } | null = null;

  // Lưu options đang chọn tạm thời (giống ProductOptionsModal)
  public currentOptions: Record<string, ProductOption[]> = {};

  private dialogRef = inject(DialogRef);

  constructor() {
    this.combo = this.dialogRef.data.combo;
    this.initializeSelections();
  }

  initializeSelections() {
    this.combo.items.forEach((slot) => {
      this.selectedItems[slot.slotName] = [];
    });
  }

  /**
   * Xử lý khi click vào món ăn
   */
  onProductClick(slot: ComboItem, product: ComboSelectableProduct, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    // Kiểm tra xem món này đã được chọn chưa
    const currentSelections = this.selectedItems[slot.slotName] || [];
    const existingIndex = currentSelections.findIndex(
      (item) => item.originalData.product.id === product.product.id,
    );

    // 1. Nếu đã chọn -> Bỏ chọn (hoặc có thể mở lại để sửa option nếu muốn logic đó)
    if (existingIndex !== -1) {
      const newSelections = [...currentSelections];
      newSelections.splice(existingIndex, 1);
      this.selectedItems[slot.slotName] = newSelections;
      return;
    }

    // 2. Nếu chưa chọn -> Kiểm tra Option
    const hasOptions = product.product.optionGroups && product.product.optionGroups.length > 0;

    if (hasOptions) {
      // ==> CHUYỂN SANG GIAO DIỆN CẤU HÌNH (Không mở modal mới)
      this.startConfiguring(slot, product);
    } else {
      // ==> Thêm trực tiếp nếu không có option
      this.addItemToState(slot, {
        originalData: product,
        selectedOptions: [],
        optionsPrice: 0,
      });
    }
  }

  // --- LOGIC CẤU HÌNH OPTION (IN-PLACE) ---

  startConfiguring(slot: ComboItem, product: ComboSelectableProduct) {
    this.configuringItem = { slot, product };
    this.currentOptions = {}; // Reset options
    this.initializeOptions(product.product.optionGroups); // Auto select min/default options
  }

  cancelConfiguring() {
    this.configuringItem = null;
    this.currentOptions = {};
  }

  /**
   * Khởi tạo options mặc định (giống ProductOptionsModal)
   */
  initializeOptions(groups?: ProductOptionGroup[]) {
    if (!groups) return;
    groups.forEach((group) => {
      const sorted = [...group.options].sort((a, b) => a.priority - b.priority);
      if (group.maxOptions === 1) {
        // Nếu bắt buộc chọn 1, chọn cái đầu tiên
        this.currentOptions[group.name] =
          group.minOptions > 0 && sorted.length > 0 ? [sorted[0]] : [];
      } else {
        this.currentOptions[group.name] = [];
      }
    });
  }

  /**
   * Xử lý khi user tích chọn option (Checkbox/Radio)
   */
  onOptionChange(group: ProductOptionGroup, option: ProductOption) {
    const current = this.currentOptions[group.name] || [];
    const isSelected = current.some((o) => o.name === option.name);

    if (group.maxOptions === 1) {
      // Logic Radio Button
      if (isSelected && group.minOptions === 0) {
        this.currentOptions[group.name] = []; // Bỏ chọn
      } else {
        this.currentOptions[group.name] = [option]; // Chọn mới
      }
    } else {
      // Logic Checkbox
      if (isSelected) {
        this.currentOptions[group.name] = current.filter((o) => o.name !== option.name);
      } else if (current.length < group.maxOptions) {
        this.currentOptions[group.name] = [...current, option];
      }
    }
  }

  isOptionSelected(groupName: string, optionName: string): boolean {
    return this.currentOptions[groupName]?.some((o) => o.name === optionName);
  }

  /**
   * Xác nhận cấu hình option -> Lưu vào list combo -> Quay lại màn hình chính
   */
  confirmConfiguration() {
    if (!this.configuringItem || !this.isOptionsValid) return;

    const { slot, product } = this.configuringItem;

    // Flatten options
    const finalOptions: OrderItemOption[] = [];
    let totalOptionsPrice = 0;

    Object.keys(this.currentOptions).forEach((groupName) => {
      this.currentOptions[groupName].forEach((opt) => {
        totalOptionsPrice += opt.priceModifier;
        finalOptions.push({
          groupName: groupName,
          optionName: opt.name,
          priceModifier: opt.priceModifier,
        });
      });
    });

    // Thêm vào state chính
    this.addItemToState(slot, {
      originalData: product,
      selectedOptions: finalOptions,
      optionsPrice: totalOptionsPrice,
    });

    // Đóng giao diện cấu hình
    this.configuringItem = null;
  }

  // --- VALIDATION ---

  get isOptionsValid(): boolean {
    if (!this.configuringItem?.product.product.optionGroups) return true;
    for (const group of this.configuringItem.product.product.optionGroups) {
      const count = this.currentOptions[group.name]?.length || 0;
      if (count < group.minOptions) return false;
    }
    return true;
  }

  getOptionGroupError(group: ProductOptionGroup): string | null {
    const count = this.currentOptions[group.name]?.length || 0;
    return count < group.minOptions ? `Chọn ít nhất ${group.minOptions}` : null;
  }

  // --- HELPER CŨ (giữ nguyên hoặc cập nhật nhẹ) ---

  private addItemToState(slot: ComboItem, item: SelectedComboItem) {
    const currentSelections = this.selectedItems[slot.slotName] || [];
    if (slot.maxSelection === 1) {
      this.selectedItems[slot.slotName] = [item];
    } else {
      if (currentSelections.length < slot.maxSelection) {
        this.selectedItems[slot.slotName] = [...currentSelections, item];
      }
    }
  }

  // ... Các hàm getSelectedOptionsText, getProductPriceText, totalPrice, onAddToCart ...
  // (Giữ nguyên logic như câu trả lời trước, chỉ cần lưu ý totalPrice tính cả optionsPrice)

  get totalPrice(): number {
    if (!this.combo) return 0;
    const allSelectedItems = Object.values(this.selectedItems).flat();
    let comboPrice = this.combo.pricingMode === ComboPricingMode.FIXED ? this.combo.comboPrice : 0;
    // ... Logic tính giá combo base (giản lược) ...
    if (this.combo.pricingMode !== ComboPricingMode.FIXED) {
      // Tính tổng giá item con nếu không fix
      comboPrice += allSelectedItems.reduce(
        (sum, i) => sum + (i.originalData.additionalPrice || 0),
        0,
      );
    } else {
      // Nếu Fixed thì cộng phụ phí
      comboPrice += allSelectedItems.reduce(
        (sum, i) => sum + (i.originalData.additionalPrice || 0),
        0,
      );
    }

    // Cộng giá Options
    const optionsTotal = allSelectedItems.reduce((sum, i) => sum + i.optionsPrice, 0);

    return comboPrice + optionsTotal;
  }

  isProductSelected(slotName: string, product: ComboSelectableProduct): boolean {
    const list = this.selectedItems[slotName];
    return list?.some((i) => i.originalData.product.id === product.product.id) ?? false;
  }

  get isFormValid(): boolean {
    if (this.configuringItem) return false; // Đang config thì không cho add
    if (!this.combo?.items) return true;
    for (const slot of this.combo.items) {
      const count = this.selectedItems[slot.slotName]?.length || 0;
      if (count < slot.minSelection) return false;
    }
    return true;
  }

  getSelectedOptionsText(slotName: string, product: ComboSelectableProduct): string {
    const list = this.selectedItems[slotName];
    const item = list?.find((i) => i.originalData.product.id === product.product.id);
    if (!item || !item.selectedOptions.length) return '';
    return item.selectedOptions.map((o) => o.optionName).join(', ');
  }

  getProductPriceText(product: ComboSelectableProduct): string {
    // Logic hiển thị giá phụ phí
    return product.additionalPrice > 0 ? `+${product.additionalPrice}đ` : '';
  }

  onAddToCart() {
    // Logic add to cart (như cũ)
    const flatSelections: OrderItemComboSelection[] = [];
    Object.keys(this.selectedItems).forEach((slotName) => {
      this.selectedItems[slotName].forEach((item) => {
        flatSelections.push({
          slotName: slotName,
          product: item.originalData.product.id,
          productName: item.originalData.product.name,
          options: item.selectedOptions,
        });
      });
    });

    const result: ComboWithOptionsResult = {
      combo: this.combo,
      selections: flatSelections,
      totalPrice: this.totalPrice,
      note: this.note,
    };
    this.dialogRef.close(result);
  }

  closeModal() {
    this.dialogRef.close();
  }
}
