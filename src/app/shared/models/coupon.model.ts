export interface Coupon {
  id: string;

  // Thông tin cơ bản
  name: string;
  description?: string;
  type: 'coupon';
  code: string;

  // Áp dụng cho sản phẩm / combo
  applicableProducts?: any[]; // lưu ObjectId
  applicableCombos?: any[]; // lưu ObjectId

  // Giá trị giảm giá
  value: number;
  valueType: 'percentage' | 'fixed';

  // Điều kiện áp dụng
  minOrderAmount: number;

  // Thời gian hiệu lực
  startDate: string | Date;
  endDate: string | Date;

  // Giới hạn sử dụng
  maxUses: number; // tổng số lần có thể dùng
  usedCount: number; // số lần đã dùng

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

// Dùng cho form thêm/sửa Coupon
export interface CouponFormData {
  name: string;
  description: string;
  type: 'coupon';
  code: string;
  applicableProducts?: string[];
  applicableCombos?: string[];
  value: number;
  valueType: 'percentage' | 'fixed';
  minOrderAmount: number;
  startDate: string | Date | any;
  endDate: string | Date | any;
  maxUses: number;
  dailyMaxUses: number;
  isActive: boolean;
}
