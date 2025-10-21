export interface BlogCategory {
  id: string; // _id từ MongoDB

  // --- Thông tin chính ---
  name: string;
  slug?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  coverImage?: string;
  postCount?: number;

  // --- Trạng thái ---
  isActive?: boolean;

  // --- Audit & Soft Delete ---
  createdBy?: any;
  isDeleted?: boolean;
  deletedAt?: string | Date;
  deletedBy?: string;

  // --- Timestamps ---
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
