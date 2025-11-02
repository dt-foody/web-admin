// Định nghĩa các kiểu dữ liệu cơ bản
// (Bạn có thể đặt file này ở một file chung, ví dụ: 'shared.model.ts')
export interface BasicUser {
  id: string;
  name: string;
  // email?: string;
}

// ===== Enums / Types (Khớp với Backend Model) =====
export type CouponType = 'discount_code' | 'freeship' | 'gift';
export type ValueType = 'fixed' | 'percentage';
export type CouponStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'EXPIRED';

// ===== Interface chính (Coupon) =====
export interface Coupon {
  id: string; // Do plugin toJSON tự động map từ _id

  // Thông tin cơ bản
  name: string;
  description: string;
  code?: string; // Mã công khai, có thể null (sparse: true)

  // Loại coupon
  type: CouponType;

  // Quy tắc giảm giá
  value: number;
  valueType: ValueType;
  maxDiscountAmount: number;
  minOrderAmount: number;

  // Hiệu lực
  startDate: string | Date;
  endDate: string | Date;

  // Giới hạn sử dụng
  maxUses: number; // Tổng số lần dùng
  usedCount: number; // Đã dùng bao nhiêu
  maxUsesPerUser: number; // Giới hạn mỗi user

  // Cấu hình hiển thị / hành vi
  public: boolean; // Hiển thị công khai?
  claimable: boolean; // Cho phép user "lưu" về?
  autoApply: boolean; // Tự động áp dụng?
  stackable: boolean; // Có thể dùng chung với coupon khác?

  // Điều kiện động
  conditions: any; // JSON object cho các điều kiện runtime

  // Trạng thái
  status: CouponStatus;

  // Audit
  createdBy: string | BasicUser; // Có thể là ID hoặc object User đã populate
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ===== Interface cho Form (Tạo/Cập nhật Coupon) =====
// Dùng cho component form của Angular
export interface CouponFormData {
  name: string;
  description: string;
  code?: string;
  type: CouponType;

  value: number;
  valueType: ValueType;
  maxDiscountAmount: number;
  minOrderAmount: number;

  startDate: string | Date | any; // 'any' cho component date picker
  endDate: string | Date | any;

  maxUses: number;
  maxUsesPerUser: number;

  public: boolean;
  claimable: boolean;
  autoApply: boolean;
  stackable: boolean;

  conditions: any; // Nhập JSON dưới dạng text
  status: CouponStatus;
}
