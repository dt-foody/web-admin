export interface Surcharge {
  id: string;
  name: string;
  cost: number; // Giá trị phụ thu
  description?: string;
  isActive: boolean;
  priority?: number; // Dùng để sắp xếp thứ tự hiển thị
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
