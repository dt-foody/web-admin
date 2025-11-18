import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

// Import Models
import {
  Combo,
  ComboItem,
  ComboSelectableProduct,
  ComboPricingMode,
  DiscountType,
} from '../../../../models/combo.model';
import { OrderItemComboSelection, OrderItemOption } from '../../../../models/order.model';
import { Product, ProductOption, ProductOptionGroup } from '../../../../models/product.model';
import { ComboWithOptionsResult } from '../../../../services/api/pos.service';

// Interface mở rộng để quản lý món đã chọn (kèm ID duy nhất và options riêng)
interface ConfiguredComboItem {
  instanceId: string; // Định danh duy nhất (quan trọng khi 1 slot chọn 2 món giống nhau)
  originalData: ComboSelectableProduct;
  selectedOptions: Record<string, ProductOption[]>; // State options của riêng món này
  calculatedOptionsPrice: number; // Giá riêng của topping đã chọn
}

@Component({
  selector: 'app-combo-options-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combo-options-modal.component.html',
})
export class ComboOptionsModalComponent implements OnInit {
  public combo: Combo;
  public note: string = '';

  // State chính lưu trữ các món đã chọn theo từng Slot
  public selections: Record<string, ConfiguredComboItem[]> = {};

  private dialogRef = inject(DialogRef);

  constructor() {
    // Lấy dữ liệu Combo được truyền vào từ Dialog
    this.combo = this.dialogRef.data.combo;
  }

  ngOnInit(): void {
    this.initializeSelections();
  }

  /**
   * 1. Khởi tạo State và Tự động chọn món (Auto-select) nếu cần
   */
  initializeSelections() {
    const initial: Record<string, ConfiguredComboItem[]> = {};

    this.combo.items.forEach((slot) => {
      initial[slot.slotName] = [];

      // Logic Auto-select: Nếu slot bắt buộc chọn (min > 0), tự động chọn n món đầu tiên/rẻ nhất
      if (slot.minSelection > 0 && slot.selectableProducts.length > 0) {
        // Sắp xếp ưu tiên món có phụ thu thấp nhất để auto-select
        const sorted = [...slot.selectableProducts].sort(
          (a, b) => a.additionalPrice - b.additionalPrice,
        );

        // Lấy n món đầu tiên
        const toSelect = sorted.slice(0, slot.minSelection);
        initial[slot.slotName] = toSelect.map((p) => this.createConfiguredItem(p));
      }
    });

    this.selections = initial;
  }

  /**
   * 2. Helper tạo một item mới kèm options mặc định (Default Options)
   */
  private createConfiguredItem(productInfo: ComboSelectableProduct): ConfiguredComboItem {
    const product = productInfo.product as Product;
    const initialOptions: Record<string, ProductOption[]> = {};

    // Tự động chọn options mặc định nếu có cấu hình (VD: Size Mặc định, Đường Mặc định)
    if (product.optionGroups) {
      product.optionGroups.forEach((group) => {
        const sorted = [...group.options].sort((a, b) => a.priority - b.priority);
        if (group.maxOptions === 1) {
          // Nếu bắt buộc chọn 1 (Radio), chọn cái đầu tiên
          initialOptions[group.name] = group.minOptions > 0 && sorted.length > 0 ? [sorted[0]] : [];
        } else {
          // Nếu chọn nhiều (Checkbox), chọn đủ số lượng min
          initialOptions[group.name] = sorted.slice(0, Math.min(group.minOptions, sorted.length));
        }
      });
    }

    return {
      instanceId: this.generateId(),
      originalData: productInfo,
      selectedOptions: initialOptions,
      calculatedOptionsPrice: this.calculateOptionsPrice(initialOptions),
    };
  }

  // --- EVENT HANDLERS (XỬ LÝ SỰ KIỆN) ---

  /**
   * 3. Xử lý khi click chọn Sản phẩm (Logic Checkbox/Radio cho Slot)
   */
  onProductClick(slot: ComboItem, productInfo: ComboSelectableProduct, event: Event) {
    event.preventDefault(); // Ngăn hành vi mặc định

    const currentList = this.selections[slot.slotName] || [];
    // Tìm xem sản phẩm này đã có trong danh sách chọn chưa
    const existingIndex = currentList.findIndex(
      (i) => i.originalData.product.id === productInfo.product.id,
    );
    const isSelected = existingIndex !== -1;

    let newList = [...currentList];

    if (slot.maxSelection === 1) {
      // === MODE RADIO (Chỉ chọn 1 món) ===
      if (isSelected) {
        // Nếu đã chọn và được phép bỏ chọn (min=0) -> Bỏ chọn
        if (slot.minSelection === 0) newList = [];
      } else {
        // Chọn món mới -> Thay thế hoàn toàn món cũ
        newList = [this.createConfiguredItem(productInfo)];
      }
    } else {
      // === MODE CHECKBOX (Chọn nhiều món) ===
      if (isSelected) {
        // Bỏ chọn món đang có
        newList.splice(existingIndex, 1);
      } else {
        // Thêm món mới nếu chưa đạt giới hạn
        if (newList.length < slot.maxSelection) {
          newList.push(this.createConfiguredItem(productInfo));
        } else {
          // (Optional) Có thể thông báo: Đã chọn tối đa số lượng
        }
      }
    }

    // Cập nhật state
    this.selections[slot.slotName] = newList;
  }

  /**
   * 4. Xử lý khi chọn Option/Topping (Cập nhật vào đúng item đang thao tác)
   */
  onOptionChange(
    event: Event,
    slotName: string,
    itemInstanceId: string,
    group: ProductOptionGroup,
    option: ProductOption,
  ) {
    event.stopPropagation(); // Ngăn sự kiện click lan ra cha (tránh chọn/bỏ chọn món chính)

    // Tìm item cụ thể bằng instanceId
    const slotItems = this.selections[slotName];
    const itemIndex = slotItems.findIndex((i) => i.instanceId === itemInstanceId);
    if (itemIndex === -1) return;

    const item = { ...slotItems[itemIndex] }; // Clone item để đảm bảo immutability
    const currentOptions = item.selectedOptions[group.name] || [];
    const isOptSelected = currentOptions.some((o) => o.name === option.name);

    let newOptions = [...currentOptions];

    if (group.maxOptions === 1) {
      // Logic Radio Button
      if (isOptSelected && group.minOptions === 0) {
        newOptions = []; // Bỏ chọn (nếu cho phép)
      } else {
        newOptions = [option]; // Chọn mới (thay thế cái cũ)
      }
    } else {
      // Logic Checkbox
      if (isOptSelected) {
        newOptions = newOptions.filter((o) => o.name !== option.name); // Bỏ chọn
      } else if (newOptions.length < group.maxOptions) {
        newOptions.push(option); // Thêm chọn
      }
    }

    // Cập nhật lại option và tính lại giá topping
    item.selectedOptions = { ...item.selectedOptions, [group.name]: newOptions };
    item.calculatedOptionsPrice = this.calculateOptionsPrice(item.selectedOptions);

    // Lưu lại vào danh sách chính
    const newSlotItems = [...slotItems];
    newSlotItems[itemIndex] = item;
    this.selections[slotName] = newSlotItems;
  }

  // --- LOGIC TÍNH TOÁN GIÁ & HIỂN THỊ ---

  /**
   * 5. Tính Tổng tiền Combo (Logic chuẩn giống React)
   */
  get totalPrice(): number {
    if (!this.combo) return 0;

    // Lấy danh sách tất cả các món đã chọn (flatten)
    const allSelections = Object.values(this.selections).flat();
    let price = 0;

    // BƯỚC 1: TÍNH GIÁ CƠ BẢN (BASE) DỰA TRÊN CHẾ ĐỘ GIÁ
    switch (this.combo.pricingMode) {
      case ComboPricingMode.FIXED:
        // Giá cố định trọn gói
        price = this.combo.comboPrice;
        break;

      case ComboPricingMode.SLOT_PRICE:
        // Tổng giá slot của từng món đã chọn
        price = allSelections.reduce((sum, item) => sum + item.originalData.slotPrice, 0);
        break;

      case ComboPricingMode.DISCOUNT: {
        // Tổng giá gốc (snapshot) của từng món
        const baseTotal = allSelections.reduce(
          (sum, item) => sum + item.originalData.snapshotPrice,
          0,
        );

        // Áp dụng giảm giá
        if (this.combo.discountType === DiscountType.PERCENT) {
          price = baseTotal * (1 - (this.combo.discountValue || 0) / 100);
        } else if (this.combo.discountType === DiscountType.AMOUNT) {
          price = Math.max(0, baseTotal - (this.combo.discountValue || 0));
        } else {
          price = baseTotal;
        }
        break;
      }
    }

    // BƯỚC 2: CỘNG PHỤ THU (Additional Price)
    // Phụ thu này thường không bị giảm giá
    const totalAdditional = allSelections.reduce(
      (sum, item) => sum + item.originalData.additionalPrice,
      0,
    );
    price += totalAdditional;

    // BƯỚC 3: CỘNG GIÁ TOPPING/OPTIONS
    // Giá topping tính riêng, cộng thẳng vào tổng
    const totalOptions = allSelections.reduce((sum, item) => sum + item.calculatedOptionsPrice, 0);
    price += totalOptions;

    return Math.round(price);
  }

  /** Tính tổng giá trị các options */
  calculateOptionsPrice(options: Record<string, ProductOption[]>): number {
    let total = 0;
    Object.values(options)
      .flat()
      .forEach((opt) => {
        total += opt.priceModifier;
      });
    return total;
  }

  /** Kiểm tra sản phẩm có được chọn hay không */
  isProductSelected(slotName: string, productId: string): boolean {
    return this.selections[slotName]?.some((i) => i.originalData.product.id === productId);
  }

  /** Lấy item cấu hình (để hiển thị options đã chọn ra UI) */
  getSelectedConfigItem(slotName: string, productId: string): ConfiguredComboItem | undefined {
    return this.selections[slotName]?.find((i) => i.originalData.product.id === productId);
  }

  /** Kiểm tra option cụ thể có được chọn hay không */
  isOptionSelected(item: ConfiguredComboItem, groupName: string, optionName: string): boolean {
    return item.selectedOptions[groupName]?.some((o) => o.name === optionName);
  }

  /**
   * Hiển thị giá bên cạnh sản phẩm:
   * - Luôn hiện giá phụ thu (Additional)
   * - Nếu mode SlotPrice -> Hiện giá Slot
   * - Nếu mode Discount -> Hiện giá gốc gạch ngang (nếu cần)
   */
  getProductPriceDisplay(product: ComboSelectableProduct): { price: string; original?: string } {
    let displayPrice = '';
    let originalPrice = '';
    const { pricingMode } = this.combo;

    if (product.additionalPrice > 0) {
      displayPrice = `+${product.additionalPrice.toLocaleString('vi-VN')}đ`;
    }

    if (pricingMode === ComboPricingMode.SLOT_PRICE) {
      const final = product.slotPrice + product.additionalPrice;
      displayPrice = `${final.toLocaleString('vi-VN')}đ`;

      if (product.snapshotPrice > final) {
        originalPrice = `${product.snapshotPrice.toLocaleString('vi-VN')}đ`;
      }
    }

    return { price: displayPrice, original: originalPrice };
  }

  // --- VALIDATION & SUBMIT ---

  /** Tạo ID ngẫu nhiên */
  generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  /** Validate: Kiểm tra đã chọn đủ số lượng min chưa */
  get isFormValid(): boolean {
    if (!this.combo?.items) return true;
    for (const slot of this.combo.items) {
      if ((this.selections[slot.slotName]?.length || 0) < slot.minSelection) return false;
    }
    return true;
  }

  getSlotSelectionText(slot: ComboItem): string {
    if (slot.minSelection === 1 && slot.maxSelection === 1) return 'Bắt buộc chọn 1';
    if (slot.minSelection === 0) return `Tùy chọn (Tối đa ${slot.maxSelection})`;
    return `Chọn ${slot.minSelection} - ${slot.maxSelection}`;
  }

  onAddToCart() {
    if (!this.isFormValid) return;

    const flatSelections: OrderItemComboSelection[] = [];

    // Duyệt qua tất cả các slot và item để tạo payload chuẩn
    Object.keys(this.selections).forEach((slotName) => {
      this.selections[slotName].forEach((item) => {
        // Flatten options từ Object sang Array
        const flatOptions: OrderItemOption[] = [];
        Object.keys(item.selectedOptions).forEach((groupName) => {
          item.selectedOptions[groupName].forEach((opt) => {
            flatOptions.push({
              groupName: groupName,
              optionName: opt.name,
              priceModifier: opt.priceModifier,
            });
          });
        });

        flatSelections.push({
          slotName: slotName,
          product: item.originalData.product.id,
          productName: item.originalData.product.name,
          options: flatOptions, // Gửi kèm options đã chọn
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
