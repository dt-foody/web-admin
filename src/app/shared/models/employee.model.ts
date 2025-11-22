export interface EmployeeEmail {
  type?: 'Home' | 'Company' | 'Other';
  value: string;
}

export interface EmployeePhone {
  type?: 'Home' | 'Company' | 'Other';
  value: string;
}

export interface EmployeeAddress {
  label?: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  fullAddress?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isDefault?: boolean;
}

export interface Employee {
  id: string; // _id từ MongoDB (thường được map bởi plugin toJSON)

  employeeId?: number; // ID tăng tự động
  user?: string; // ID của tài khoản User (auth) liên kết

  name: string; // Tên đầy đủ

  gender?: 'male' | 'female' | 'other'; // Giới tính
  birthDate?: string | Date; // Ngày sinh

  emails?: EmployeeEmail[];
  phones?: EmployeePhone[];

  // --- ĐỊA CHỈ ---
  addresses?: EmployeeAddress[];

  roles?: any[]; // Danh sách ID Role custom mà user được gán
  extraPermissions?: any[]; // Các quyền bổ sung riêng của user
  excludePermissions?: any[]; // Các quyền bị loại trừ

  // --- METADATA ---
  lastOrderDate?: string | Date; // Thêm trường này (có trong schema)

  // --- THÔNG TIN QUẢN TRỊ ---
  createdBy?: string | any; // ID User tạo (nên là string thay vì any)
  isDeleted?: boolean; // Tài khoản đã xóa
  deletedAt?: string | Date; // Thời điểm xóa
  deletedBy?: string | any; // ID User xóa (nên là string thay vì any)

  createdAt?: string | Date; // Thời điểm tạo
  updatedAt?: string | Date; // Thời điểm cập nhật
}

export interface EmployeeFormData {
  // --- THÔNG TIN CƠ BẢN ---
  name: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string | Date;

  isActive: boolean;
  isEmailVerified: boolean;

  // --- THÔNG TIN LIÊN HỆ (DẠNG MẢNG) ---
  // Sử dụng lại interface EmployeeEmail và EmployeePhone đã định nghĩa
  emails: EmployeeEmail[];
  phones: EmployeePhone[];

  role: string;
  roles: string[];
  extraPermissions: string[];
  excludePermissions: string[];

  // --- ĐỊA CHỈ GIAO HÀNG ---
  addresses: EmployeeAddress[];
}
