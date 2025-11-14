import { Category } from './category.model';

// --- 1. Sub-interface cho Product Option ---
export interface ProductOption {
  name: string;
  priceModifier: number; // Có thể dùng number vì Decimal128 khi trả về JSON sẽ là string/number
  type: 'fixed_amount' | 'percentage';
  isActive: boolean;
  priority: number;
}

// --- 2. Sub-interface cho Nhóm Tùy Chọn ---
export interface ProductOptionGroup {
  name: string;
  minOptions: number;
  maxOptions: number;
  priority: number;
  options: ProductOption[];
}

// --- 3. Interface Product chính ---
export interface Product {
  id: string;

  // Thông tin cơ bản
  name: string;
  description?: string;
  basePrice: number;
  category: string | Category | any;
  sku?: string;

  image?: string;

  // Quản lý trạng thái
  isActive: boolean;
  priority: number;

  // Nhóm tùy chọn (size, topping, etc.)
  optionGroups?: ProductOptionGroup[];

  // Audit & Soft delete
  createdBy?: any;
  isDeleted?: boolean;
  deletedAt?: string | Date | null;
  deletedBy?: any;

  // Timestamps
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  basePrice: number;
  category: any;
  image: string;
  isActive: boolean;
  priority: number;
  optionGroups: ProductOptionGroup[];
}
