import { Product } from './product.model';

export interface ComboSelectableProduct {
  /** ID của sản phẩm có thể chọn trong slot này */
  product: any;

  /** Giá cố định trong combo (độc lập với giá sản phẩm gốc) */
  fixedPrice: number;

  /** Giới hạn số lượng sản phẩm này có thể chọn */
  maxQuantity: number;
}

export interface ComboItem {
  /** Tên vị trí trong combo (VD: Đồ uống chính, Món ăn kèm) */
  slotName: string;

  /** Danh sách các sản phẩm có thể chọn cho vị trí này */
  selectableProducts: ComboSelectableProduct[];

  /** Có bắt buộc chọn 1 sản phẩm cho slot này không */
  isRequired: boolean;
}

export interface Combo {
  /** ID của combo */
  id: string;

  /** Tên combo */
  name: string;

  /** Mô tả chi tiết combo */
  description: string;

  /** Giá tổng combo (đã giảm) */
  comboPrice: number;

  /** Ảnh đại diện combo */
  thumbnailUrl?: string;

  /** Ngày bắt đầu và kết thúc áp dụng */
  startDate: Date | string | any;
  endDate: Date | string | any;

  /** Danh sách các thành phần (slot) trong combo */
  items: ComboItem[];

  /** Trạng thái hiển thị/bán */
  isActive: boolean;

  /** Thứ tự ưu tiên hiển thị */
  priority: number;

  /** Người tạo combo */
  createdBy: any;

  /** Trạng thái xóa mềm */
  isDeleted?: boolean;
  deletedAt?: Date | string;
  deletedBy?: any;

  /** Tự động thêm khi tạo/sửa */
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ComboFormData {
  name: string;
  description: string;
  comboPrice: number;
  thumbnailUrl?: string;
  startDate: Date | string | any;
  endDate: Date | string | any;
  items: ComboItem[];
  isActive: boolean;
  priority: number;
}
