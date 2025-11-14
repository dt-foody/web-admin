import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from '../../models/customer.model';
import {
  Order,
  OrderItem,
  OrderPayment,
  OrderShipping,
  OrderItemOption, // SỬA: Import OrderItemOption
} from '../../models/order.model';
import { Product, ProductOption } from '../../models/product.model';

// SỬA: Interface cho kết quả trả về từ Modal
interface ProductWithOptionsResult {
  product: Product;
  options: OrderItemOption[]; // Modal phải trả về mảng đã được làm phẳng
  totalPrice: number;
  note: string;
}

// SỬA: Cập nhật State để khớp với Order Model
export interface PosCartState {
  orderType: Order['orderType'];
  channel: Order['channel'];
  profile: string | null; // SỬA: Dùng profile
  profileType: Order['profileType'] | null; // SỬA: Dùng profileType
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  payment: OrderPayment;
  shipping: OrderShipping | null;
  status: Order['status'];
  note: string;
}

// SỬA: Cập nhật initialState
const initialState: PosCartState = {
  orderType: 'TakeAway',
  channel: 'POS',
  profile: null, // SỬA: Dùng profile
  profileType: null, // SỬA: Dùng profileType
  items: [],
  totalAmount: 0,
  discountAmount: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash',
    status: 'pending',
  },
  shipping: null,
  status: 'pending',
  note: '',
};

@Injectable()
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

  /**
   * SỬA: Hàm addItem được viết lại hoàn toàn.
   * Nó có thể nhận 1 Product (click nhanh)
   * hoặc 1 object ProductWithOptionsResult (từ modal)
   */
  public addItem(itemInput: Product | ProductWithOptionsResult) {
    const state = this.getCurrentCart();
    let newItems: OrderItem[];

    // Tách biến
    const isModalResult = (itemInput as any).product && (itemInput as any).options;
    const product: Product = isModalResult
      ? (itemInput as ProductWithOptionsResult).product
      : (itemInput as Product);
    const options: OrderItemOption[] = isModalResult
      ? (itemInput as ProductWithOptionsResult).options
      : [];
    const price: number = isModalResult
      ? (itemInput as ProductWithOptionsResult).totalPrice
      : (product as any).basePrice || (product as any).price || 0;
    const note: string = isModalResult ? (itemInput as ProductWithOptionsResult).note : '';

    // Nếu không phải từ modal (không có options), thì tìm và tăng số lượng
    if (!isModalResult) {
      const existingItem = state.items.find(
        (item) =>
          item.item === product.id && item.itemType === 'Product' && item.options.length === 0,
      );

      if (existingItem) {
        newItems = state.items.map((item) =>
          item.item === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        const newItem: OrderItem = {
          item: product.id,
          itemType: 'Product',
          name: product.name,
          quantity: 1,
          basePrice: (product as any).basePrice || (product as any).price || 0,
          price: price,
          options: [],
          comboSelections: [],
          note: '',
        };
        newItems = [...state.items, newItem];
      }
    } else {
      // Nếu từ modal (có options), luôn tạo item mới
      const newItem: OrderItem = {
        item: product.id,
        itemType: 'Product',
        name: product.name,
        quantity: 1,
        basePrice: (product as any).basePrice || (product as any).price || 0,
        price: price,
        options: options,
        comboSelections: [],
        note: note,
      };
      newItems = [...state.items, newItem];
    }

    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Dùng itemId (chính là item.item)
  public updateQuantity(itemId: string, newQuantity: number) {
    const state = this.getCurrentCart();
    if (newQuantity <= 0) {
      this.removeItem(itemId);
      return;
    }

    const newItems = state.items.map((item) =>
      item.item === itemId ? { ...item, quantity: newQuantity } : item,
    );
    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Dùng itemId
  public removeItem(itemId: string) {
    const state = this.getCurrentCart();
    const newItems = state.items.filter((item) => item.item !== itemId);
    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Cập nhật profile và profileType
  public setCustomer(customer: Customer | null) {
    const state = this.getCurrentCart();
    this.updateState({
      ...state,
      profile: customer ? customer.id : null,
      profileType: customer ? 'Customer' : null,
    });
  }

  public setOrderType(type: Order['orderType']) {
    const state = this.getCurrentCart();
    let shipping: OrderShipping | null = state.shipping;
    let shippingFee = Number(state.shippingFee || 0);

    if (type === 'Delivery') {
      if (!shipping) {
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
      shipping = null;
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
