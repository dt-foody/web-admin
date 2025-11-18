import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog';

// Import models
import {
  Combo,
  ComboItem,
  ComboSelectableProduct,
  ComboPricingMode,
  DiscountType,
} from '../../../../models/combo.model';
import { Product } from '../../../../models/product.model';

// Import interfaces đã tạo ở Bước 1
import {
  ComboWithOptionsResult,
} from '../../../../services/api/pos.service';
import { OrderItemComboSelection } from '../../../../models/order.model';

@Component({
  selector: 'app-combo-options-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combo-options-modal.component.html',
})
export class ComboOptionsModalComponent {
  public combo: Combo;
  public note: string = '';

  /**
   * State lưu trữ các lựa chọn của người dùng.
   * Ví dụ: { "Món chính": [product1], "Nước uống": [product2] }
   */
  public selectedProducts: Record<string, ComboSelectableProduct[]> = {};

  private dialogRef = inject(DialogRef);

  constructor() {
    // Lấy combo data từ component cha (pos-menu)
    this.combo = this.dialogRef.data.combo;
    this.initializeSelections();
  }

  /**
   * Khởi tạo state selectedProducts với các slot rỗng
   */
  initializeSelections() {
    this.combo.items.forEach((slot) => {
      this.selectedProducts[slot.slotName] = [];
    });
  }

  /**
   * Xử lý khi người dùng click chọn 1 sản phẩm trong 1 slot
   */
  onProductClick(slot: ComboItem, product: ComboSelectableProduct, event: Event) {
    event.preventDefault(); // Ngăn hành vi mặc định (nếu có)

    // Lấy danh sách đang chọn của slot này
    const currentSelections = this.selectedProducts[slot.slotName] || [];
    // Kiểm tra sản phẩm này đã được chọn chưa
    const isSelected = currentSelections.some((p) => p.product.id === product.product.id);

    if (slot.maxSelection === 1) {
      // Logic cho slot chọn 1
      if (isSelected && slot.minSelection === 0) {
        // Nếu đã chọn và min = 0 -> cho phép bỏ chọn
        this.selectedProducts[slot.slotName] = [];
      } else {
        // Nếu chưa chọn, hoặc min > 0 -> gán chọn
        this.selectedProducts[slot.slotName] = [product];
      }
    } else {
      // Logic cho slot chọn nhiều
      if (isSelected) {
        // Nếu đã chọn -> Bỏ chọn (filter ra)
        this.selectedProducts[slot.slotName] = currentSelections.filter(
          (p) => p.product.id !== product.product.id,
        );
      } else if (currentSelections.length < slot.maxSelection) {
        // Nếu chưa chọn và chưa đạt max -> Thêm vào
        this.selectedProducts[slot.slotName] = [...currentSelections, product];
      }
      // (Nếu đã đạt max thì không làm gì cả)
    }
  }

  /**
   * Tính toán tổng giá tiền của combo dựa trên các lựa chọn
   */
  get totalPrice(): number {
    if (!this.combo) return 0;

    // Lấy tất cả sản phẩm đã chọn từ tất cả các slot
    const allSelections = Object.values(this.selectedProducts).flat();
    let calculatedPrice = 0;

    // Tính giá dựa trên từng chế độ của combo
    switch (this.combo.pricingMode) {
      case ComboPricingMode.FIXED:
        // Giá cố định: Bằng giá combo + phụ phí của từng sản phẩm
        calculatedPrice = this.combo.comboPrice;
        calculatedPrice += allSelections.reduce((sum, p) => sum + p.additionalPrice, 0);
        break;

      case ComboPricingMode.SLOT_PRICE:
        // Giá theo slot: Bằng tổng giá slot + phụ phí của từng sản phẩm
        calculatedPrice = allSelections.reduce((sum, p) => sum + p.slotPrice, 0);
        calculatedPrice += allSelections.reduce((sum, p) => sum + p.additionalPrice, 0);
        break;

      case ComboPricingMode.DISCOUNT: {
        // Giá theo giảm giá: Bằng tổng giá gốc (snapshot) của sản phẩm...
        const originalTotal = allSelections.reduce((sum, p) => sum + p.snapshotPrice, 0);

        // ...áp dụng giảm giá của combo...
        if (this.combo.discountType === DiscountType.PERCENT) {
          calculatedPrice = originalTotal * (1 - (this.combo.discountValue || 0) / 100);
        } else if (this.combo.discountType === DiscountType.AMOUNT) {
          calculatedPrice = originalTotal - (this.combo.discountValue || 0);
        } else {
          calculatedPrice = originalTotal;
        }

        // ...cuối cùng + phụ phí
        calculatedPrice += allSelections.reduce((sum, p) => sum + p.additionalPrice, 0);
        break;
      }
    }

    return Math.max(0, calculatedPrice); // Đảm bảo giá không bị âm
  }

  /**
   * Hiển thị giá cho từng sản phẩm trong modal (phụ phí hoặc giá đầy đủ)
   */
  getProductPriceText(product: ComboSelectableProduct): string {
    const { pricingMode } = this.combo;

    if (pricingMode === ComboPricingMode.FIXED) {
      return product.additionalPrice > 0
        ? `+${product.additionalPrice.toLocaleString('vi-VN')}đ`
        : 'Miễn phí';
    }

    if (pricingMode === ComboPricingMode.SLOT_PRICE) {
      const price = (product.slotPrice || 0) + (product.additionalPrice || 0);
      return `${price.toLocaleString('vi-VN')}đ`;
    }

    if (pricingMode === ComboPricingMode.DISCOUNT) {
      // Hiển thị giá gốc để người dùng biết họ đang chọn gì
      const price = (product.snapshotPrice || 0) + (product.additionalPrice || 0);
      return `${price.toLocaleString('vi-VN')}đ`;
    }

    return '';
  }

  /**
   * Kiểm tra 1 sản phẩm có đang được chọn hay không
   */
  isProductSelected(slotName: string, product: ComboSelectableProduct): boolean {
    return this.selectedProducts[slotName]?.some((p) => p.product.id === product.product.id);
  }

  /**
   * Kiểm tra toàn bộ form (tất cả các slot) đã valid chưa
   */
  get isFormValid(): boolean {
    if (!this.combo?.items) return true;
    // Kiểm tra từng slot, nếu có 1 slot bị lỗi -> form invalid
    for (const slot of this.combo.items) {
      if (this.getSlotError(slot)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Lấy text lỗi cho từng slot (ví dụ: "Chọn ít nhất 1")
   */
  getSlotError(slot: ComboItem): string | null {
    const selectedCount = this.selectedProducts[slot.slotName]?.length || 0;
    if (selectedCount < slot.minSelection) {
      return `Chọn ít nhất ${slot.minSelection} mục`;
    }
    return null;
  }

  /**
   * Lấy text hướng dẫn cho từng slot (ví dụ: "Chọn 1", "Chọn 1-2")
   */
  getSlotSelectionText(slot: ComboItem): string {
    if (slot.maxSelection === 1) {
      return slot.minSelection > 0 ? 'Bắt buộc (Chọn 1)' : 'Tùy chọn (Chọn 1)';
    }
    const parts = [];
    if (slot.minSelection > 0) {
      parts.push(`Chọn ${slot.minSelection}-${slot.maxSelection}`);
    } else {
      parts.push(`Chọn tối đa ${slot.maxSelection}`);
    }
    return parts.join(' ');
  }

  /**
   * Xử lý khi bấm nút "Thêm vào giỏ"
   */
  onAddToCart() {
    if (!this.isFormValid) return;

    // 1. "Làm phẳng" (flatten) các lựa chọn
    const flatSelections: OrderItemComboSelection[] = [];
    Object.keys(this.selectedProducts).forEach((slotName) => {
      this.selectedProducts[slotName].forEach((selectableProduct) => {
        return flatSelections.push({
            slotName: slotName,
            product: selectableProduct.product.id,
            productName: selectableProduct.product.name,
            options: []
        });
      });
    });

    // 2. Tạo object kết quả
    const result: ComboWithOptionsResult = {
      combo: this.combo,
      selections: flatSelections,
      totalPrice: this.totalPrice,
      note: this.note,
    };

    // 3. Đóng modal và trả về kết quả
    this.dialogRef.close(result);
  }

  /**
   * Đóng modal mà không trả về gì
   */
  closeModal() {
    this.dialogRef.close();
  }
}
