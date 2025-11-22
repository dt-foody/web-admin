export interface User {
  id: string; // _id từ MongoDB

  name: string; // Tên người dùng
  email: string; // Địa chỉ email
  password?: string; // Chỉ dùng khi tạo/sửa (không nên trả về từ API)

  role: string; // Vai trò hệ thống (vd: "admin", "staff", "guest")

  isActive?: boolean; // Đã xác thực email hay chưa
  isEmailVerified?: boolean; // Đã xác thực email hay chưa

  createdAt?: string | Date; // Thời điểm tạo
  updatedAt?: string | Date; // Thời điểm cập nhật
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
}
