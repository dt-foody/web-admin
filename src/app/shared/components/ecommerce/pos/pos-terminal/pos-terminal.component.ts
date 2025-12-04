import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { PosStateService } from '../../../../services/api/pos.service';
import { PosCartComponent } from '../pos-cart/pos-cart.component';
import { PosCheckoutComponent } from '../pos-checkout/pos-checkout.component';
import { PosMenuComponent } from '../pos-menu/pos-menu.component';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { MenuService } from '../../../../services/api/menu.service';
import { CategoryService } from '../../../../services/api/category.service';
import { Product } from '../../../../models/product.model';
import { Combo } from '../../../../models/combo.model';
import { Category } from '../../../../models/category.model';
import { environment } from '../../../../../../environments/environment';

@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [PosMenuComponent, PosCartComponent, PosCheckoutComponent],
  templateUrl: './pos-terminal.component.html',
  providers: [PosStateService],
})
export class PosTerminalComponent implements OnInit {
  products: Product[] = [];
  combos: Combo[] = [];
  categories: Category[] = [];

  constructor(
    private productService: ProductService,
    private comboService: ComboService,
    private categoryService: CategoryService,
    private menuService: MenuService,
  ) {}

  ngOnInit(): void {
    forkJoin({
      products: this.productService.getAll({ limit: 1000 }),
      combos: this.comboService.getAll({
        limit: 1000,
        populate: 'items.selectableProducts.product',
      }),
      categories: this.categoryService.getAll({ limit: 1000, level: 1 }),
    }).subscribe({
      next: ({ products, combos, categories }: any) => {
        this.products = products.data || products.results || [];
        this.products.forEach((p) => {
          p.image = p.image ? `${environment.urlBaseImage}${p.image}` : '';
        });

        this.combos = combos.data || combos.results || [];
        this.combos.forEach((c) => {
          c.image = c.image ? `${environment.urlBaseImage}${c.image}` : '';
        });

        this.categories = categories.data || categories.results || [];
        this.categories.forEach((cat) => {
          cat.image = cat.image ? `${environment.urlBaseImage}${cat.image}` : '';
        });

        this.loadMenu();
      },
      error: (err) => console.error('Error loading master data', err),
    });
  }

  loadMenu(): void {
    this.menuService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        const { flashSaleCategory, combos: menuCombos } = data;

        const listProductsSale = flashSaleCategory?.products || [];
        const listCombosSale = menuCombos || [];

        this.products.forEach((product) => {
          const found = listProductsSale.find((item: Product) => item.id === product.id);
          if (found) {
            product.basePrice = found.salePrice;
          }
        });

        this.combos.forEach((combo) => {
          const found = listCombosSale.find((item: Combo) => item.id === combo.id);
          if (found) {
            combo.comboPrice = found.salePrice;
          }
        });
      },
      error: (err) => console.error('Error loading menu', err),
    });
  }
}
