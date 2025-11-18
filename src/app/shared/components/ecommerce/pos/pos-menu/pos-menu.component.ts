import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';

import { Product } from '../../../../models/product.model';
import { Combo } from '../../../../models/combo.model';
import { Category } from '../../../../models/category.model';
import {
  ComboWithOptionsResult,
  PosStateService,
  ProductWithOptionsResult,
} from '../../../../services/api/pos.service';

import { ProductOptionsModalComponent } from '../product-options-modal/product-options-modal.component';
import { ComboOptionsModalComponent } from '../combo-options-modal/combo-options-modal.component';

@Component({
  selector: 'app-pos-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-menu.component.html',
})
export class PosMenuComponent implements OnChanges {
  // --- NHẬN INPUT TỪ CHA ---
  @Input() products: Product[] = [];
  @Input() combos: Combo[] = [];
  @Input() categories: Category[] = [];

  // --- Service ---
  private posState = inject(PosStateService);
  private dialogService = inject(DialogService);

  // --- State nội bộ ---
  public filteredProducts: Product[] = [];
  public filteredCombos: Combo[] = []; // Thêm mảng combo đã lọc để hỗ trợ search

  // selectedCategoryId có thể là: 'all', 'combo', hoặc id của category
  public selectedCategoryId: string = 'all';
  public searchTerm: string = '';

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    // Cập nhật bộ lọc khi input thay đổi
    if (changes['products'] || changes['combos']) {
      this.applyFilters();
    }
  }

  /**
   * Lọc danh sách sản phẩm VÀ combo dựa trên state (category, search)
   */
  private applyFilters(): void {
    const lowerTerm = this.searchTerm.toLowerCase();

    // 1. Xử lý Combos (luôn lọc để sẵn sàng hiển thị hoặc search)
    let tempCombos = [...this.combos];
    if (this.searchTerm) {
      tempCombos = tempCombos.filter((c) => c.name.toLowerCase().includes(lowerTerm));
    }
    this.filteredCombos = tempCombos;

    // 2. Xử lý Products
    let tempProducts = [...this.products];

    // Lọc theo Category (nếu không phải 'all' và không phải 'combo')
    if (this.selectedCategoryId !== 'all' && this.selectedCategoryId !== 'combo') {
      tempProducts = tempProducts.filter((p) => p.category === this.selectedCategoryId);
    }

    // Lọc theo Search Term
    if (this.searchTerm) {
      tempProducts = tempProducts.filter((p) => p.name.toLowerCase().includes(lowerTerm));
    }

    this.filteredProducts = tempProducts;
  }

  // --- Event Handlers từ Template ---

  // Bỏ hàm onSelectTab

  onSelectCategory(categoryId: string): void {
    this.selectedCategoryId = categoryId;
    // Reset search khi đổi category nếu muốn trải nghiệm clean hơn,
    // hoặc giữ nguyên search term tùy logic dự án. Ở đây mình giữ search term.
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  onProductClick(product: Product): void {
    const hasOptions = product.optionGroups && product.optionGroups.length > 0;

    if (hasOptions) {
      const dialogRef = this.dialogService.open(ProductOptionsModalComponent, {
        size: 'md',
        data: { product: product },
      });

      dialogRef.afterClosed$.subscribe((result: ProductWithOptionsResult) => {
        if (result) {
          this.posState.addItem(result);
        }
      });
    } else {
      this.posState.addItem(product);
    }
  }

  onComboClick(combo: Combo): void {
    const dialogRef = this.dialogService.open(ComboOptionsModalComponent, {
      size: 'lg',
      data: { combo: combo },
    });

    dialogRef.afterClosed$.subscribe((result: ComboWithOptionsResult) => {
      if (result) {
        this.posState.addItem(result);
      }
    });
  }
}
