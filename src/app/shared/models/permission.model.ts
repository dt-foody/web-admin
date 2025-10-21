export interface Permission {
  id: string; // _id từ MongoDB

  resource: string; // Tài nguyên, ví dụ: 'product'
  action: string; // Hành động, ví dụ: 'create'
  name: string; // Tên định danh duy nhất, ví dụ: 'product.create'
  description?: string; // Mô tả chi tiết

  createdAt?: string; // Thời điểm tạo (timestamps)
  updatedAt?: string; // Thời điểm cập nhật (timestamps)
}
