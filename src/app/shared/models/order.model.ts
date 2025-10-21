import { Combo } from './combo.model';
import { Customer } from './customer.model';
import { Product } from './product.model';

export interface OrderItem {
  product: string | Product | any; // ObjectId (ref Product)
  combo?: string | Combo | any; // ObjectId (ref Combo)
  name: string; // Tên sản phẩm
  quantity: number; // Số lượng
  price: number | string; // Giá (Decimal128 -> string/number)
  note: string; // Ghi chú
}

export interface OrderPayment {
  method: 'cash' | 'momo' | 'vnpay'; // Phương thức thanh toán
  status: 'pending' | 'paid' | 'failed'; // Trạng thái thanh toán
  transactionId?: string; // Mã giao dịch
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

  orderId: Number;

  customer: string | Customer | any; // ID hoặc object khách hàng

  items: OrderItem[]; // Danh sách sản phẩm
  totalAmount: number | string; // Tổng tiền hàng
  discountAmount?: number | string; // Giảm giá
  shippingFee?: number | string; // Phí vận chuyển
  grandTotal: number | string; // Tổng cuối cùng

  payment: OrderPayment; // Thông tin thanh toán
  shipping: OrderShipping; // Thông tin giao hàng

  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'canceled'; // Trạng thái đơn hàng

  note: string; // Ghi chú đơn hàng

  createdBy?: any; // Nhân viên xác nhận (User)
  createdAt?: string | Date; // Thời điểm tạo
  updatedAt?: string | Date; // Thời điểm cập nhật
}
