import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { Order, OrderItem, OrderPayment, OrderShipping } from '../../models/order.model';
import { Product } from '../../models/product.model';

// Trạng thái giỏ hàng (Cart State)
// Sử dụng các trường từ model Order của bạn
export interface PosCartState {
  orderType: Order['orderType']; // 'TakeAway' | 'DineIn' | 'Delivery'
  channel: Order['channel'];
  customer: string | Customer | null; // Cho phép null (khách vãng lai)
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  payment: OrderPayment;
  shipping: OrderShipping | null; // Cho phép null (không giao hàng)
  status: Order['status'];
  note: string;
}

// Giá trị khởi tạo cho giỏ hàng mới
const initialState: PosCartState = {
  orderType: 'TakeAway', // Mặc định là mang đi
  channel: 'POS', // Kênh bán hàng là POS
  customer: null, // Mặc định là khách vãng lai
  items: [],
  totalAmount: 0,
  discountAmount: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash',
    status: 'pending', // Sẽ đổi thành 'paid' khi gửi
  },
  shipping: null, // Mặc định không giao hàng
  status: 'pending',
  note: '',
};

@Injectable() // QUAN TRỌNG: Không có `providedIn: 'root'`.
export class PosStateService {
  private readonly cartState = new BehaviorSubject<PosCartState>(initialState);
  public readonly cartState$: Observable<PosCartState> = this.cartState.asObservable();

  constructor() {
    console.log('PosStateService Initialized!');
  }

  public getCurrentCart(): PosCartState {
    return this.cartState.getValue();
  }

  // --- CÁC HÀNH ĐỘNG TỪ COMPONENT ---

  public addItem(product: Product) {
    const state = this.getCurrentCart();
    const productId = product.id; // Model OrderItem.product là string (ID)
    const existingItem = state.items.find((item) => item.product === productId);

    let newItems: OrderItem[];

    if (existingItem) {
      newItems = state.items.map((item) =>
        item.product === productId ? { ...item, quantity: item.quantity + 1 } : item,
      );
    } else {
      const newItem: OrderItem = {
        product: productId, // Lưu ID (string)
        name: product.name,
        quantity: 1,
        price: (product as any).basePrice || 0, // Dùng basePrice hoặc price
        note: '',
        combo: null, // Mặc định không phải combo
      };
      newItems = [...state.items, newItem];
    }
    this.updateState({ ...state, items: newItems });
  }

  public updateQuantity(productId: string, newQuantity: number) {
    const state = this.getCurrentCart();
    let newItems = state.items.map((item) =>
      item.product === productId ? { ...item, quantity: newQuantity } : item,
    );
    newItems = newItems.filter((item) => item.quantity > 0);
    this.updateState({ ...state, items: newItems });
  }

  public removeItem(productId: string) {
    const state = this.getCurrentCart();
    const newItems = state.items.filter((item) => item.product !== productId);
    this.updateState({ ...state, items: newItems });
  }

  public setCustomer(customer: Customer | null) {
    const state = this.getCurrentCart();
    // Model của bạn lưu ID (string) hoặc object Customer. Lưu ID là tốt nhất.
    this.updateState({ ...state, customer: customer ? customer.id : null });
  }

  public setOrderType(type: Order['orderType']) {
    const state = this.getCurrentCart();
    let shipping: OrderShipping | null = state.shipping;
    let shippingFee = Number(state.shippingFee || 0);

    if (type === 'Delivery') {
      if (!shipping) {
        // Tạo mới nếu chưa có
        shipping = {
          address: {
            recipientName: '',
            recipientPhone: '',
            street: '',
            ward: '',
            district: '',
            city: '',
          },
          status: 'pending',
        };
      }
    } else {
      shipping = null; // Xóa shipping nếu là TakeAway/DineIn
      shippingFee = 0;
    }
    this.updateState({ ...state, orderType: type, shipping, shippingFee });
  }

  public setShippingFee(fee: number) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, shippingFee: fee });
  }

  public setDiscount(amount: number) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, discountAmount: amount });
  }

  public setNote(note: string) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, note });
  }

  public setPaymentMethod(method: OrderPayment['method']) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, payment: { ...state.payment, method: method } });
  }

  public resetCart() {
    this.cartState.next(initialState);
  }

  // --- LOGIC NỘI BỘ ---

  private updateState(newState: PosCartState) {
    const stateWithTotals = this.calculateTotals(newState);
    this.cartState.next(stateWithTotals);
  }

  private calculateTotals(state: PosCartState): PosCartState {
    const totalAmount = state.items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);

    const grandTotal =
      totalAmount - Number(state.discountAmount || 0) + Number(state.shippingFee || 0);

    return { ...state, totalAmount, grandTotal };
  }
}
