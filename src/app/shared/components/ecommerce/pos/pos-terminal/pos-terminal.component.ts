import { Component, OnInit } from '@angular/core'; // SỬA: Thêm OnInit
import { PosStateService } from '../../../../services/api/pos.service';
import { PosCartComponent } from '../pos-cart/pos-cart.component';
import { PosCheckoutComponent } from '../pos-checkout/pos-checkout.component';
import { PosMenuComponent } from '../pos-menu/pos-menu.component';
// SỬA: Import services
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { Product } from '../../../../models/product.model';
import { Combo } from '../../../../models/combo.model';
import { environment } from '../../../../../../environments/environment';
import { CategoryService } from '../../../../services/api/category.service';
import { Category } from '../../../../models/category.model';

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [PosMenuComponent, PosCartComponent, PosCheckoutComponent],
  templateUrl: './pos-terminal.component.html',
  providers: [PosStateService],
})
export class PosTerminalComponent implements OnInit {
  // SỬA: Khai báo data
  products: Product[] = [];
  combos: Combo[] = [];
  categories: Category[] = [];

  constructor(
    private productService: ProductService,
    private comboService: ComboService,
    private categoryService: CategoryService,
  ) {}

  ngOnInit(): void {
    // SỬA: Tải master data khi terminal được khởi tạo
    this.loadProducts();
    this.loadCombos();
    this.loadCategories();
  }

  loadProducts(): void {
    this.productService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.products = data.data || data.results || [];
        this.products.forEach((el) => {
          el.image = el.image ? `${environment.urlBaseImage}${el.image}` : '';
        });
      },
    });
  }

  loadCombos(): void {
    this.comboService
      .getAll({ limit: 1000, populate: 'items.selectableProducts.product' })
      .subscribe({
        next: (data: any) => {
          this.combos = data.data || data.results || [];
          this.combos.forEach((el) => {
            el.image = el.image ? `${environment.urlBaseImage}${el.image}` : '';
          });
        },
      });
  }

  loadCategories(): void {
    this.categoryService.getAll({ limit: 1000, level: 1 }).subscribe({
      next: (data: any) => {
        this.categories = data.data || data.results || [];
        this.categories.forEach((el) => {
          el.image = el.image ? `${environment.urlBaseImage}${el.image}` : '';
        });
      },
    });
  }
}
