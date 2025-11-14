import { Product } from './product.model';

/**
 * Enum định nghĩa 3 chế độ tính giá
 */
export enum ComboPricingMode {
  FIXED = 'FIXED',
  SLOT_PRICE = 'SLOT_PRICE',
  DISCOUNT = 'DISCOUNT',
}

/**
 * MỚI: Enum định nghĩa loại giảm giá
 */
export enum DiscountType {
  PERCENT = 'PERCENT',
  AMOUNT = 'AMOUNT',
  NONE = 'NONE', // Mặc định khi không phải MODE_DISCOUNT
}

export interface ComboSelectableProduct {
  product: any;
  snapshotPrice: number;
  additionalPrice: number;
  slotPrice: number;
}

export interface ComboItem {
  slotName: string;
  selectableProducts: ComboSelectableProduct[];
  minSelection: number;
  maxSelection: number;
}

// --- CẬP NHẬT COMBO INTERFACE ---
export interface Combo {
  id: string;
  name: string;
  description: string;
  image?: string;
  startDate: Date | string | any;
  endDate: Date | string | any;
  items: ComboItem[];
  isActive: boolean;
  priority: number;
  createdBy: any;
  isDeleted?: boolean;
  deletedAt?: Date | string;
  deletedBy?: any;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // --- CÁC TRƯỜNG MỚI ĐÃ REFACTOR ---
  pricingMode: ComboPricingMode;
  comboPrice: number; // Vẫn dùng cho MODE_FIXED

  /** MỚI: Loại giảm giá (PERCENT | AMOUNT | NONE) */
  discountType: DiscountType;
  /** MỚI: Giá trị giảm (VD: 30 (cho 30%) hoặc 20000 (cho 20k VND)) */
  discountValue: number;

  /** BỎ: discountAmount */
  /** BỎ: discountPercent */
}

// --- CẬP NHẬT COMBOFORM INTERFACE ---
export interface ComboFormData {
  name: string;
  description: string;
  image?: string;
  startDate: Date | string | any;
  endDate: Date | string | any;
  items: ComboItem[];
  isActive: boolean;
  priority: number;

  // --- CÁC TRƯỜNG MỚI ĐÃ REFACTOR ---
  pricingMode: ComboPricingMode;
  comboPrice: number;
  discountType: DiscountType;
  discountValue: number;
}
