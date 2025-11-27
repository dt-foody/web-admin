// src/app/core/models/voucher.model.ts (hoặc common.model.ts tùy project)

import { Coupon } from "./coupon.model";
import { Customer } from "./customer.model";
import { Employee } from "./employee.model";
import { User } from "./user.model";

// ===== Enums / Types =====

export type VoucherStatus = 'UNUSED' | 'USED' | 'EXPIRED' | 'REVOKED';
export type IssueMode = 'CLAIM' | 'ADMIN' | 'AUTO' | 'REFERRAL';
export type DiscountSnapshotType = 'fixed_amount' | 'percentage';
export type VoucherProfileType = 'Customer' | 'Employee' | null; // 🔥 Type mới

/**
 * Snapshot quy tắc giảm giá tại thời điểm phát hành.
 */
export interface DiscountSnapshot {
  type: DiscountSnapshotType;
  value: number;
  maxDiscount: number;
  minOrderAmount?: number; // 🔥 Bổ sung field này để khớp logic validate ở FE/BE
}

// ===== Interface chính (Voucher Instance) =====

/**
 * Đại diện cho Voucher đã cấp phát
 */
export interface Voucher {
  id: string;

  // --- [UPDATED] Dynamic Profile Link ---
  // Thay thế cho field `customer` cũ
  profileType: VoucherProfileType;
  
  // Dữ liệu profile đã populate (có thể là Customer hoặc Employee)
  profile: Customer | Employee | string | null; 

  // --- Liên kết khác ---
  coupon: string | Coupon;
  orders?: string[]; // Backend mới hỗ trợ mảng orders (nếu dùng nhiều lần)
  // order?: string; // Giữ lại nếu backend chưa migration xong mảng

  // --- Mã voucher ---
  code: string;

  // --- Nguồn phát hành ---
  issueMode: IssueMode;

  // --- Trạng thái ---
  status: VoucherStatus;

  // --- Vòng đời ---
  issuedAt: string | Date;
  usedAt?: string | Date | null; // Lần dùng gần nhất
  expiredAt: string | Date;
  revokeAt?: string | Date | null;
  revokedBy?: string | User | null;

  // --- Thống kê ---
  usageCount: number;
  usageLimit: number;

  // --- Snapshot Rule ---
  discountSnapshot: DiscountSnapshot;

  // --- Audit ---
  createdBy?: string | User | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ===== Interface cho Form (Create/Update) =====

export interface VoucherFormData {
  // --- [UPDATED] Chọn đối tượng nhận ---
  profile: string | null; // ID của Customer hoặc Employee
  profileType: VoucherProfileType; // Loại đối tượng

  coupon: string; // ID Coupon gốc
  code?: string; // Optional (nếu để trống BE tự sinh)
  
  expiredAt: string | Date;
  usageLimit: number;
  issueMode: IssueMode;
  
  // Status thường mặc định là UNUSED khi tạo mới
  status?: VoucherStatus;
}
