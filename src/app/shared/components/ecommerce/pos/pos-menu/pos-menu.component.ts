import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../../models/category.model';
import { Product } from '../../../../models/product.model';
import { CategoryService } from '../../../../services/api/category.service';
import { PosStateService } from '../../../../services/api/pos.service';
import { ProductService } from '../../../../services/api/product.service';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { DialogService } from '@ngneat/dialog';
import { ProductOptionsModalComponent } from '../product-options-modal/product-options-modal.component';
@Component({
  selector: 'app-pos-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, InputFieldComponent],
  templateUrl: './pos-menu.component.html',
  styles: `
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
    }
  `,
})
export class PosMenuComponent implements OnInit {
  private posState = inject(PosStateService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService); // Thêm service Category
  private dialogService = inject(DialogService); // Inject DialogService

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  selectedCategoryId: string | 'all' = 'all';
  searchQuery = '';

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories() {
    this.categoryService.getAll({ limit: 100 }).subscribe((res: any) => {
      this.categories = res.data || res.results || [];
    });
  }

  loadProducts() {
    this.productService.getAll({ limit: 1000 }).subscribe((res: any) => {
      this.allProducts = res.data || res.results || [];
      this.filterProducts();
    });
  }

  onSelectCategory(categoryId: string | 'all') {
    this.selectedCategoryId = categoryId;
    this.filterProducts();
  }

  filterProducts() {
    let products = this.allProducts;

    // Lọc theo Category
    if (this.selectedCategoryId !== 'all') {
      products = products.filter(
        (p) =>
          (p.category as any)?.id === this.selectedCategoryId ||
          p.category === this.selectedCategoryId,
      );
    }

    // Lọc theo Search Query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(query));
    }

    this.filteredProducts = products;
  }

  onProductClick(product: Product) {
    if (product.optionGroups && product.optionGroups.length > 0) {
      // 1. Mở modal và LƯU LẠI THAM CHIẾU (dialogRef)
      const dialogRef = this.dialogService.open(ProductOptionsModalComponent, {
        size: 'lg',
        data: { product: product },
      });

      // 2. Lắng nghe sự kiện khi modal đóng (đây là phần quan trọng)
      dialogRef.afterClosed$.subscribe((result) => {
        console.log('result', result);
        if (result) {
          // 4. Chỉ khi có kết quả, bạn mới thêm vào state
          this.posState.addItem(result);
        }
      });
    } else {
      // Nếu không có tùy chọn, trực tiếp thêm sản phẩm vào giỏ hàng
      this.posState.addItem(product);
    }
  }
}
