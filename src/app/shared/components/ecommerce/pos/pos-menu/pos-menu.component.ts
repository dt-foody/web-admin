import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';

import { Product } from '../../../../models/product.model';
import { Combo } from '../../../../models/combo.model';
import { Category } from '../../../../models/category.model';
import { ComboWithOptionsResult, PosStateService, ProductWithOptionsResult } from '../../../../services/api/pos.service';

// (Đây là modal bạn đã cung cấp)
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
  private toastr = inject(ToastrService);

  // --- State nội bộ ---
  public filteredProducts: Product[] = [];
  public selectedTab: 'products' | 'combos' = 'products';
  public selectedCategoryId: string | 'all' = 'all';
  public searchTerm: string = '';

  constructor() {
    // Không inject ProductService hay ComboService ở đây nữa
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Khi @Input() products thay đổi (lần đầu tiên hoặc sau này)
    if (changes['products']) {
      this.applyFilters();
    }
  }

  /**
   * Lọc danh sách sản phẩm dựa trên state (tab, category, search)
   */
  private applyFilters(): void {
    let tempProducts = [...this.products];

    // 1. Lọc theo Category
    if (this.selectedCategoryId !== 'all') {
      tempProducts = tempProducts.filter((p) => p.category === this.selectedCategoryId);
    }

    // 2. Lọc theo Search Term
    if (this.searchTerm) {
      const lowerTerm = this.searchTerm.toLowerCase();
      tempProducts = tempProducts.filter((p) => p.name.toLowerCase().includes(lowerTerm));
    }

    this.filteredProducts = tempProducts;
  }

  // --- Event Handlers từ Template ---

  onSelectTab(tab: 'products' | 'combos'): void {
    this.selectedTab = tab;
    // (applyFilters() sẽ được gọi nếu bạn lọc cả combo)
  }

  onSelectCategory(categoryId: string | 'all'): void {
    this.selectedCategoryId = categoryId;
    this.applyFilters();
  }

  onSearch(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.applyFilters();
  }

  /**
   * Xử lý khi click 1 sản phẩm
   * - Nếu có options -> Mở modal
   * - Nếu không -> Thêm thẳng vào giỏ
   */
  onProductClick(product: Product): void {
    const hasOptions = product.optionGroups && product.optionGroups.length > 0;

    if (hasOptions) {
      // 1. Mở Modal (sử dụng modal component bạn đã cung cấp)
      const dialogRef = this.dialogService.open(ProductOptionsModalComponent, {
        size: 'md',
        data: {
          product: product,
        },
      });

      // 2. Lắng nghe kết quả
      dialogRef.afterClosed$.subscribe((result: ProductWithOptionsResult) => {
        if (result) {
          // 3. Thêm (Product + Options) vào giỏ
          this.posState.addItem(result); //
        }
      });
    } else {
      // 1. Thêm (Product đơn giản) thẳng vào giỏ
      this.posState.addItem(product); //
    }
  }

  onComboClick(combo: Combo): void {
    // 1. Mở Modal Combo
    const dialogRef = this.dialogService.open(ComboOptionsModalComponent, {
      size: 'lg', // Combo modal thường cần to hơn
      data: {
        combo: combo,
      },
    });

    // 2. Lắng nghe kết quả
    dialogRef.afterClosed$.subscribe((result: ComboWithOptionsResult) => {
      if (result) {
        // 3. Thêm (Combo + Lựa chọn) vào giỏ
        this.posState.addItem(result); // Gửi kết quả cho service
      }
    });

    // Bỏ phần code cũ
    // console.warn('Chức năng thêm combo vào giỏ hàng POS chưa được hỗ trợ.', combo);
    // this.toastr.info('Chức năng thêm combo từ POS hiện chưa được hỗ trợ.');
  }
}
