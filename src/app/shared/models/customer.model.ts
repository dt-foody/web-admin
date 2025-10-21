export interface Customer {
  id: string; // _id từ MongoDB

  customerId?: number; // ID tăng tự động cho khách hàng

  name: string; // Tên đầy đủ
  email: string; // Email
  password?: string; // Chỉ dùng khi tạo/sửa (không nên trả về API)
  phone: string; // Số điện thoại
  gender?: 'male' | 'female' | 'other'; // Giới tính
  birthDate?: string | Date; // Ngày sinh

  addresses?: {
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
  }[];

  isActive?: boolean; // Tài khoản có hoạt động
  isDeleted?: boolean; // Tài khoản đã xóa
  deletedAt?: string | Date; // Thời điểm xóa
  createdBy?: any; // ID User tạo
  deletedBy?: any; // ID User xóa

  createdAt?: string | Date; // Thời điểm tạo
  updatedAt?: string | Date; // Thời điểm cập nhật
}
