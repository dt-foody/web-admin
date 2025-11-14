export interface CustomerEmail {
  type?: 'Home' | 'Company' | 'Other';
  value: string;
}

export interface CustomerPhone {
  type?: 'Home' | 'Company' | 'Other';
  value: string;
}

export interface CustomerAddress {
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

export interface Customer {
  id: string; // _id từ MongoDB (thường được map bởi plugin toJSON)

  customerId?: number; // ID tăng tự động
  user?: string; // ID của tài khoản User (auth) liên kết

  name: string; // Tên đầy đủ

  gender?: 'male' | 'female' | 'other'; // Giới tính
  birthDate?: string | Date; // Ngày sinh

  emails?: CustomerEmail[];
  phones?: CustomerPhone[];

  // --- ĐỊA CHỈ ---
  addresses?: CustomerAddress[];

  // --- METADATA ---
  isActive?: boolean; // Tài khoản có hoạt động
  lastOrderDate?: string | Date; // Thêm trường này (có trong schema)

  // --- THÔNG TIN QUẢN TRỊ ---
  createdBy?: string | any; // ID User tạo (nên là string thay vì any)
  isDeleted?: boolean; // Tài khoản đã xóa
  deletedAt?: string | Date; // Thời điểm xóa
  deletedBy?: string | any; // ID User xóa (nên là string thay vì any)

  createdAt?: string | Date; // Thời điểm tạo
  updatedAt?: string | Date; // Thời điểm cập nhật
}

export interface CustomerFormData {
  // --- THÔNG TIN CƠ BẢN ---
  name: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string | Date;

  // --- THÔNG TIN LIÊN HỆ (DẠNG MẢNG) ---
  // Sử dụng lại interface CustomerEmail và CustomerPhone đã định nghĩa
  emails: CustomerEmail[];
  phones: CustomerPhone[];

  // --- ĐỊA CHỈ GIAO HÀNG ---
  addresses: CustomerAddress[];

  // --- METADATA ---
  isActive: boolean;
}
