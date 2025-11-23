// Giả định bạn có một file định nghĩa các interface cơ bản
// (Ví dụ: 'src/app/core/models/common.model.ts')
export interface BasicUser {
  id: string;
  name: string;
}

export interface BasicCustomer {
  id: string;
  name: string;
  // email?: string;
}

export interface BasicCouponInfo {
  id: string;
  name: string;
  code?: string; // Mã code công khai của coupon gốc
}

// ===== Enums / Types (Khớp với Backend Model) =====

export type VoucherStatus = 'UNUSED' | 'USED' | 'EXPIRED' | 'REVOKED';
export type IssueMode = 'CLAIM' | 'ADMIN' | 'AUTO' | 'REFERRAL';
export type DiscountSnapshotType = 'fixed_amount' | 'percentage';

/**
 * Snapshot (bản ghi) các quy tắc giảm giá tại thời điểm
 * voucher được phát hành.
 * Khớp với DiscountSnapshotSchema trong model backend.
 */
export interface DiscountSnapshot {
  type: DiscountSnapshotType;
  value: number;
  maxDiscount: number;
}

// ===== Interface chính (Voucher Instance) =====

/**
 * Đại diện cho một phiếu giảm giá cụ thể đã được cấp
 * cho một khách hàng.
 */
export interface Voucher {
  id: string; // Do plugin toJSON tự động map từ _id

  // --- Liên kết ---
  // Các trường này có thể là string (ID) hoặc object (nếu populate)
  customer: any;
  coupon: string | BasicCouponInfo;
  order?: string; // ID của đơn hàng đã sử dụng

  // --- Mã voucher (duy nhất cho user này) ---
  code: string;

  // --- Nguồn phát hành ---
  issueMode: IssueMode;

  // --- Trạng thái sử dụng ---
  status: VoucherStatus;

  // --- Vòng đời ---
  issuedAt: string | Date;
  usedAt?: string | Date | null;
  expiredAt: string | Date;
  revokeAt?: string | Date | null;
  revokedBy?: string | BasicUser | null;

  // --- Thống kê (nếu 1 voucher dùng được nhiều lần) ---
  usageCount: number;
  usageLimit: number;

  // --- Snapshot rule (Bắt buộc) ---
  discountSnapshot: DiscountSnapshot;

  // --- Audit ---
  createdBy?: string | BasicUser | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ===== Interface cho Form (Vd: Admin cấp phát voucher) =====
export interface VoucherFormData {
  customer: string; // ID khách hàng
  coupon: string; // ID của Coupon gốc (để hệ thống tự tạo snapshot)
  code: string; // Mã code (có thể để trống để hệ thống tự sinh)
  expiredAt: string | Date | any; // Ngày hết hạn
  usageLimit: number;
  issueMode: IssueMode;

  // discountSnapshot sẽ được backend tạo dựa trên couponId
}
