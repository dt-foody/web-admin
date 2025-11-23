export interface PricePromotion {
  id: string;

  // Thông tin cơ bản
  name: string;
  description: string;

  // Áp dụng cho Product hoặc Combo
  product?: string | null; // ObjectId của Product
  combo?: string | null; // ObjectId của Combo

  // Loại giảm giá: percentage (%) hoặc fixed_amount (tiền cố định)
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;

  // Thời gian hiệu lực
  startDate: string | Date | any;
  endDate: string | Date | any;

  // Giới hạn sử dụng
  maxQuantity: number; // tổng số lần áp dụng
  usedQuantity: number; // số lần đã dùng

  dailyMaxUses: number; // số lần tối đa trong 1 ngày
  lastUsedDate: string | Date;
  dailyUsedCount: number; // số lần đã dùng trong ngày

  // Trạng thái
  isActive: boolean;

  // Audit & Soft delete
  createdBy: any;
  isDeleted: boolean;
  deletedAt?: string | Date | null;
  deletedBy?: any;

  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Dùng cho form thêm/sửa PricePromotion
export interface PricePromotionFormData {
  name: string;
  description: string;
  product?: string | null;
  combo?: string | null;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  startDate: string | Date | any;
  endDate: string | Date | any;
  maxQuantity: number;
  dailyMaxUses: number;
  isActive: boolean;
}
