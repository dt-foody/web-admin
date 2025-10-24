// Dùng để định nghĩa kiểu dữ liệu User cơ bản, bạn có thể thay thế bằng interface User đầy đủ
export interface BasicUser {
  id: string;
  name: string;
}

// Interface chính, đại diện cho dữ liệu coupon từ API
export interface Coupon {
  id: string;

  // Thông tin cơ bản
  name: string;
  description: string;
  type: 'discount_code' | 'freeship' | 'gift';
  code: string;

  // MỚI: Phân loại public/private
  visibility: 'public' | 'private';
  // MỚI: Danh sách người dùng được áp dụng (khi private)
  applicableUsers?: any[]; // Có thể là string[] (chỉ ID) hoặc BasicUser[] (khi populate)

  // Áp dụng cho sản phẩm / combo
  applicableProducts?: any[]; // lưu ObjectId
  applicableCombos?: any[]; // lưu ObjectId

  // Giá trị giảm giá
  value: number;
  valueType: 'percentage' | 'fixed';
  // MỚI: Giảm giá tối đa cho loại percentage
  maxDiscountAmount?: number;

  // Điều kiện áp dụng
  minOrderAmount: number;

  // Thời gian hiệu lực
  startDate: string | Date;
  endDate: string | Date;

  // Giới hạn sử dụng
  maxUses: number; // tổng số lần có thể dùng
  usedCount: number; // số lần đã dùng
  // MỚI: Giới hạn sử dụng cho mỗi người dùng
  maxUsesPerUser: number;

  dailyMaxUses: number; // số lần tối đa trong 1 ngày
  lastUsedDate?: string | Date;
  dailyUsedCount: number; // số lần đã dùng trong ngày

  // Trạng thái
  isActive: boolean;

  // Audit & Soft delete
  createdBy: any; // Có thể là string (ID) hoặc BasicUser (khi populate)
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
  type: 'discount_code' | 'freeship' | 'gift';
  code: string;

  // MỚI: Các trường để quản lý public/private và giới hạn
  visibility: 'public' | 'private';
  applicableUsers?: string[]; // Form sẽ quản lý danh sách ID của người dùng
  maxDiscountAmount?: number;
  maxUsesPerUser: number;

  // Các trường cũ
  applicableProducts?: string[];
  applicableCombos?: string[];
  value: number;
  valueType: 'percentage' | 'fixed';
  minOrderAmount: number;
  startDate: string | Date | any; // 'any' để linh hoạt với các component chọn ngày
  endDate: string | Date | any;
  maxUses: number;
  dailyMaxUses: number;
  isActive: boolean;
}
