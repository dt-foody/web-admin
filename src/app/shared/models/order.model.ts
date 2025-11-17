import { Customer } from './customer.model';
import { Product } from './product.model';
import { Combo } from './combo.model';
import { User } from './user.model'; // Giả định có type User cho createdBy

/* ============================================================
 * 1. ENUMS (Đồng bộ 100% với Backend)
 * ============================================================ */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivering'
  | 'completed'
  | 'canceled'
  | 'refunded';

export type PaymentMethod = 'cash' | 'payos' | 'momo' | 'vnpay' | 'bank_transfer';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type ShippingStatus =
  | 'pending'
  | 'preparing'
  | 'delivering'
  | 'delivered'
  | 'failed'
  | 'canceled';

export interface OrderItemOption {
  groupName: string;
  optionName: string;
  priceModifier: number;
}

export interface OrderItemComboSelection {
  slotName: string;
  product: string | Product; // ObjectId (ref 'Product')
  productName: string; // Tên snapshot
  options: OrderItemOption[];
}

export interface OrderItem {
  id?: string; // id của sub-document
  item: any; // string | Product | Combo; // ObjectId (refPath: 'itemType')
  itemType: 'Product' | 'Combo';
  name: string; // Tên snapshot
  quantity: number;
  basePrice: number; // Giá gốc
  price: number; // Giá bán cuối cùng của 1 item
  options: OrderItemOption[]; // Dùng khi itemType == 'Product'
  comboSelections: OrderItemComboSelection[]; // Dùng khi itemType == 'Combo'
  note?: string;
  image?: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  checkoutUrl?: string;
  qrCode?: string;
}

export interface OrderShippingAddress {
  label?: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  ward: string;
  district: string;
  city: string;
}

export interface OrderShipping {
  address: OrderShippingAddress;
  status: ShippingStatus;
}

export interface OrderAppliedCoupon {
  id: string; // ObjectId (ref 'Coupon')
  code: string;
  type: string;
  value: number;
}

export interface Order {
  id: string;
  orderId: number; // ID tăng tự động
  orderCode: number; // Mã cho PayOS

  // Profile (Khách hàng hoặc Nhân viên)
  profileType?: 'Customer' | 'Employee';
  profile?: any; // string | Customer | User; // ID hoặc object đã populate

  // Chi tiết đơn hàng
  items: OrderItem[];

  // Chi tiết giá
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;

  // Thông tin thanh toán
  payment: OrderPayment;

  // Thông tin giao hàng (có thể null)
  shipping?: OrderShipping | null;

  // Trạng thái & Ghi chú
  status: OrderStatus;
  note?: string;

  // Coupon
  appliedCoupons?: OrderAppliedCoupon[];

  // Meta
  createdBy?: string | User; // Nhân viên tạo (nếu có)
  createdAt: string | Date;
  updatedAt: string | Date;

  // --- CÁC TRƯỜNG MONG MUỐN CỦA BẠN (Sẽ thêm ở mục 4) ---
  orderType?: 'TakeAway' | 'DineIn' | 'Delivery';
  channel?: 'AdminPanel' | 'POS' | 'WebApp' | 'MobileApp' | 'Grab';
}

export interface OrderFormData {
  profile: string | null;
  profileType: 'Customer' | 'Employee' | null;
  orderType: 'TakeAway' | 'DineIn' | 'Delivery';
  channel: 'AdminPanel' | 'POS' | 'WebApp' | 'MobileApp' | 'Grab';

  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  grandTotal: number;

  payment: OrderPayment;
  shipping?: OrderShipping | null;

  status: OrderStatus;
  note: string;

  // UI discount
  discountType: 'fixed' | 'percentage';
  discountValue: number;
}

export const DEFAULT_SHIPPING_ADDRESS: OrderShippingAddress = {
  recipientName: '',
  recipientPhone: '',
  street: '',
  ward: '',
  district: '',
  city: '',
};

export const DEFAULT_FORM: OrderFormData = {
  profile: null,
  profileType: null,
  orderType: 'TakeAway',
  channel: 'AdminPanel',
  items: [],
  totalAmount: 0,
  discountType: 'fixed',
  discountValue: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash' as PaymentMethod,
    status: 'pending' as PaymentStatus,
  },
  shipping: null,
  status: 'pending' as OrderStatus,
  note: '',
};