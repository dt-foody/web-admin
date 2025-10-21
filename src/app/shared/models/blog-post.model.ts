export interface BlogPost {
  id: string; // _id từ MongoDB

  // --- Thông tin chính ---
  title: string;
  slug?: string;
  summary: string;
  content: string; // HTML hoặc Markdown
  coverImage: string; // URL ảnh đại diện
  coverImageAlt: string;

  // --- Phân loại ---
  categories?: any[]; // Mảng ID category
  tags?: any[];

  // --- Tác giả ---
  author: any;

  // --- Trạng thái xuất bản ---
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string | Date;
  isFeatured?: boolean;
  isPinned?: boolean;

  // --- SEO ---
  seoTitle: string;
  seoDescription: string;

  // --- Thống kê ---
  views?: number;

  // --- Audit & Soft Delete ---
  createdBy?: any;
  updatedBy?: any;
  isDeleted?: boolean;
  deletedAt?: string | Date;
  deletedBy?: string;

  // --- Timestamps ---
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
