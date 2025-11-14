import { Combo } from './combo.model';
import { Customer } from './customer.model';
import { Product } from './product.model';

export interface OrderItem {
  product: string | Product | any; // ObjectId (ref Product)
  combo?: string | Combo | any; // ObjectId (ref Combo)
  name: string;
  quantity: number;
  price: number | string;
  note: string;
}

export interface OrderPayment {
  method: 'cash' | 'momo' | 'vnpay' | 'payos'; // Thêm payos từ model
  status: 'pending' | 'paid' | 'failed';
  transactionId?: string;
  checkoutUrl?: string; // Thêm từ model
}

export interface OrderShipping {
  address: {
    label?: string;
    recipientName: string;
    recipientPhone: string;
    street: string;
    ward: string;
    district: string;
    city: string;
  };
  status: 'pending' | 'delivering' | 'delivered' | 'failed';
}

export interface Order {
  id: string; // _id từ MongoDB
  orderId: number;

  // --- CẢI TIẾN QUAN TRỌNG ---
  // 1. Phân loại đơn hàng
  orderType: 'TakeAway' | 'DineIn' | 'Delivery';
  channel: 'AdminPanel' | 'POS' | 'WebApp' | 'MobileApp' | 'Grab';

  // 2. Profile là tùy chọn (cho khách vãng lai)
  profile?: string | Customer | any; // ID hoặc object khách hàng
  profileType?: 'Customer' | 'Employee';

  items: OrderItem[];
  totalAmount: number | string;
  discountAmount?: number | string;
  shippingFee?: number | string;
  grandTotal: number | string;

  payment: OrderPayment;

  // 3. Shipping là tùy chọn (chỉ cần khi orderType === 'Delivery')
  shipping?: OrderShipping;

  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'canceled';
  note: string;

  createdBy?: any; // Nhân viên xác nhận (User)
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
