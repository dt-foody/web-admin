export interface Role {
  id: string; // _id từ MongoDB

  name: string; // Tên role (ví dụ: "Admin", "Staff", ...)
  description: string; // Mô tả chi tiết

  permissions: string[]; // Danh sách ID của Permission
  createdBy?: any; // ID hoặc object User tạo role
  createdAt?: string; // Thời điểm tạo (timestamps)
  updatedAt?: string; // Thời điểm cập nhật (timestamps)
}
