export interface Category {
  id: string; // Mongoose sẽ tự tạo
  name: string;
  description?: string;
  image?: string; // URL hình ảnh
  isActive: boolean;
  priority?: number;
  parent?: any; // ID của category cha
  ancestors?: any[];
  createdBy: any; // ID của user tạo
  isDeleted?: boolean;
  createdAt?: string; // từ timestamps
  updatedAt?: string; // từ timestamps
}
