import { Component } from '@angular/core';
import { DialogRef } from '@ngneat/dialog';
import { Product, ProductOption, ProductOptionGroup } from '../../../../models/product.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-options-modal',
  standalone: true, // Thêm standalone: true nếu đây là component mới
  imports: [CommonModule, FormsModule],
  templateUrl: './product-options-modal.component.html',
})
export class ProductOptionsModalComponent {
  productForOptions: Product | null = null;
  selectedOptions: Record<string, ProductOption[]> = {};
  note: string = '';

  constructor(private dialogRef: DialogRef) {
    const data = this.dialogRef.data;
    this.productForOptions = data?.product;
    this.initializeOptions();
  }

  initializeOptions() {
    if (!this.productForOptions) return;
    const initial: Record<string, ProductOption[]> = {};
    this.productForOptions.optionGroups?.forEach((group) => {
      const sortedOptions = [...group.options].sort((a, b) => a.priority - b.priority);
      if (group.maxOptions === 1) {
        initial[group.name] =
          group.minOptions > 0 && sortedOptions.length > 0 ? [sortedOptions[0]] : [];
      } else {
        initial[group.name] = sortedOptions.slice(
          0,
          Math.min(group.minOptions, sortedOptions.length),
        );
      }
    });
    this.selectedOptions = initial;
  }

  onOptionChange(group: ProductOptionGroup, option: ProductOption, event: Event) {
    event.preventDefault(); // Giữ nguyên logic này, nó rất tốt
    this.selectedOptions = { ...this.selectedOptions }; // Đảm bảo change detection
    const currentOptions = [...(this.selectedOptions[group.name] || [])];
    const isSelected = currentOptions.some((o) => o.name === option.name);

    if (group.maxOptions === 1) {
      if (isSelected && group.minOptions === 0) {
        // Cho phép bỏ chọn (rất hay)
        this.selectedOptions[group.name] = [];
      } else {
        this.selectedOptions[group.name] = [option];
      }
    } else {
      if (isSelected) {
        this.selectedOptions[group.name] = currentOptions.filter((o) => o.name !== option.name);
      } else if (currentOptions.length < group.maxOptions) {
        this.selectedOptions[group.name].push(option);
      }
    }
  }

  get totalPrice(): number {
    const base = this.productForOptions?.basePrice ?? 0;
    const options = Object.values(this.selectedOptions ?? {}).flat();

    // **CẢI TIẾN:** Đơn giản hóa logic.
    // Logic `opt.type === 'percentage'` dường như bị lỗi vì 'type' không có
    // trong model. Giờ nó chỉ cộng `priceModifier`.
    return options.reduce((price, opt) => price + opt.priceModifier, base);
  }

  isOptionSelected(groupName: string, optionName: string): boolean {
    const groupOptions = this.selectedOptions?.[groupName];
    return !!groupOptions?.some((o) => o.name === optionName);
  }

  get isFormValid(): boolean {
    if (!this.productForOptions?.optionGroups) return true;

    for (const group of this.productForOptions.optionGroups) {
      const selectedCount = this.selectedOptions[group.name]?.length || 0;
      if (selectedCount < group.minOptions) {
        return false;
      }
    }
    return true;
  }

  getGroupError(group: ProductOptionGroup): string | null {
    const selected = this.selectedOptions[group.name]?.length || 0;
    if (selected < group.minOptions) {
      return `Chọn ít nhất ${group.minOptions} mục`;
    }
    return null;
  }

  getGroupSelectionText(group: ProductOptionGroup): string {
    if (group.maxOptions === 1) {
      return group.minOptions > 0 ? 'Bắt buộc (Chọn 1)' : 'Tùy chọn (Chọn 1)';
    }
    const parts = [];
    if (group.minOptions > 0) {
      parts.push(`Chọn ${group.minOptions}-${group.maxOptions}`);
    } else {
      parts.push(`Chọn tối đa ${group.maxOptions}`);
    }
    return parts.join(' ');
  }

  onAddToCart() {
    if (this.isFormValid && this.productForOptions) {
      this.dialogRef.close({
        product: this.productForOptions,
        options: this.selectedOptions,
        totalPrice: this.totalPrice,
        note: this.note,
      });
    }
  }

  closeModal() {
    this.dialogRef.close();
  }
}
