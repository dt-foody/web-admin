import { Product } from './product.model';
import { Combo } from './combo.model';

export interface MenuProductCategory {
  id: string;
  name: string;
  priority: number;
  products: Product[];
}

export interface FlashSaleItem extends Product {
  type: 'Product' | 'Combo';
}

export interface FlashSaleCategory {
  id: string;
  name: string;
  priority: number;
  products: FlashSaleItem[];
}

export interface Menu {
  flashSaleCategory: FlashSaleCategory | null;
  thucDon: MenuProductCategory[];
  combos: Combo[];
}
