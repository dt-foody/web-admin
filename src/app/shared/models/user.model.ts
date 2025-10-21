export interface User {
  id: string; // _id từ MongoDB

  name: string; // Tên người dùng
  email: string; // Địa chỉ email
  password?: string; // Chỉ dùng khi tạo/sửa (không nên trả về từ API)

  role: string; // Vai trò hệ thống (vd: "admin", "staff", "guest")

  rolesCustom?: any[]; // Danh sách ID Role custom mà user được gán
  extraPermissions?: any[]; // Các quyền bổ sung riêng của user
  excludePermissions?: any[]; // Các quyền bị loại trừ

  isEmailVerified?: boolean; // Đã xác thực email hay chưa

  createdAt?: string | Date; // Thời điểm tạo
  updatedAt?: string | Date; // Thời điểm cập nhật
}
