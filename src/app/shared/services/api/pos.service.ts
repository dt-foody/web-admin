import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from '../../models/customer.model';
import {
  Order,
  OrderItem,
  OrderPayment,
  OrderShipping,
  OrderItemOption,
  // SỬA: Import DiscountType và OrderFormData (hoặc các type cần thiết)
  DEFAULT_FORM,
  OrderFormData,
} from '../../models/order.model';
import { Product } from '../../models/product.model';

// SỬA: Interface cho kết quả trả về từ Modal
export interface ProductWithOptionsResult {
  product: Product;
  options: OrderItemOption[];
  totalPrice: number;
  note: string;
}

// SỬA: Cập nhật initialState
const initialState: OrderFormData = {
  orderType: 'TakeAway',
  channel: 'POS',
  profile: null,
  profileType: null,
  items: [],

  // SỬA: Khởi tạo discount mới
  discountType: 'fixed',
  discountValue: 0,

  shippingFee: 0,
  totalAmount: 0,
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
  private readonly cartState = new BehaviorSubject<OrderFormData>(initialState);
  public readonly cartState$: Observable<OrderFormData> = this.cartState.asObservable();

  constructor() {
    console.log('PosStateService Initialized!');
  }

  public getCurrentCart(): OrderFormData {
    // Trả về một bản sao để đảm bảo tính bất biến (immutable)
    return { ...this.cartState.getValue() };
  }

  // --- CÁC HÀNH ĐỘNG TỪ COMPONENT ---

  /**
   * SỬA: Hàm addItem (đã ok trong file của bạn)
   */
  public addItem(itemInput: Product | ProductWithOptionsResult) {
    const state = this.getCurrentCart();
    let newItems: OrderItem[];

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
          basePrice: (product as any)?.basePrice || (product as any)?.price || 0,
          price: price,
          options: [],
          comboSelections: [],
          note: '',
          image: product?.image || '',
        };
        newItems = [...state.items, newItem];
      }
    } else {
      const newItem: OrderItem = {
        item: product.id,
        itemType: 'Product',
        name: product.name,
        quantity: 1,
        basePrice: (product as any)?.basePrice || (product as any)?.price || 0,
        price: price,
        options: options,
        comboSelections: [],
        note: note,
        image: product?.image || '',
      };
      newItems = [...state.items, newItem];
    }

    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Dùng itemId (đã ok)
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

  // SỬA: Dùng itemId (đã ok)
  public removeItem(itemId: string) {
    const state = this.getCurrentCart();
    const newItems = state.items.filter((item) => item.item !== itemId);
    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Cập nhật profile và profileType (đã ok)
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
    let shipping: OrderShipping | null | undefined = state.shipping;
    let shippingFee = Number(state.shippingFee || 0);

    shipping = null;
    shippingFee = 0;

    this.updateState({ ...state, orderType: type, shipping, shippingFee });
  }

  public setShippingFee(fee: number) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, shippingFee: fee });
  }

  // SỬA: Cập nhật 2 hàm setDiscount...
  public setDiscountValue(value: number) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, discountValue: value || 0 });
  }

  public setDiscountType(type: 'fixed' | 'percentage') {
    const state = this.getCurrentCart();
    this.updateState({ ...state, discountType: type });
  }

  // (Hàm setDiscount(amount) cũ không còn dùng)

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

  private updateState(newState: OrderFormData) {
    const stateWithTotals = this.calculateTotals(newState);
    this.cartState.next(stateWithTotals);
  }

  // SỬA: Cập nhật calculateTotals để dùng discountType/Value
  private calculateTotals(state: OrderFormData): OrderFormData {
    const totalAmount = state.items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);

    // Tính discount thực tế
    const discountValue = Number(state.discountValue || 0);
    let discountAmount = 0;
    if (state.discountType === 'percentage') {
      discountAmount = (totalAmount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const grandTotal = totalAmount - discountAmount + Number(state.shippingFee || 0);

    // Lưu ý: `discountAmount` vừa tính KHÔNG được lưu lại state
    // state chỉ lưu `discountType` và `discountValue`
    return { ...state, totalAmount, grandTotal };
  }
}
