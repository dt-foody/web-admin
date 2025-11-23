import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Customer } from '../../models/customer.model';
import {
  Order,
  OrderItem,
  OrderPayment,
  OrderShipping,
  OrderItemOption,
  OrderFormData,
  OrderItemComboSelection,
} from '../../models/order.model';
import { Product } from '../../models/product.model';
import { Combo } from '../../models/combo.model';

export interface ProductWithOptionsResult {
  product: Product;
  options: OrderItemOption[];
  totalPrice: number;
  note: string;
}

export interface ComboWithOptionsResult {
  combo: Combo;
  selections: OrderItemComboSelection[];
  totalPrice: number;
  note: string;
}

// Định nghĩa lại OrderItem để TypeScript không báo lỗi field tempId
// Nếu bạn có thể sửa file model, hãy thêm tempId?: string vào interface OrderItem gốc
type OrderItemWithTempId = OrderItem & { tempId?: string };

const initialState: OrderFormData = {
  orderType: 'TakeAway',
  channel: 'POS',
  profile: null,
  profileType: null,
  items: [],
  discountType: 'fixed_amount',
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

@Injectable({ providedIn: 'root' })
export class PosStateService {
  private readonly cartState = new BehaviorSubject<OrderFormData>(initialState);
  public readonly cartState$: Observable<OrderFormData> = this.cartState.asObservable();

  constructor() {
    console.log('PosStateService Initialized!');
  }

  public getCurrentCart(): OrderFormData {
    return { ...this.cartState.getValue() };
  }

  // --- HÀM HELPER TẠO ID DUY NHẤT CHO FRONTEND ---
  private generateTempId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // --- CÁC HÀNH ĐỘNG TỪ COMPONENT ---

  public addItem(itemInput: Product | ProductWithOptionsResult | ComboWithOptionsResult) {
    const state = this.getCurrentCart();
    const newItems: OrderItemWithTempId[] = [...state.items];

    // Type Guards
    const isProductWithOption = (itemInput as any).product && (itemInput as any).options;
    const isComboResult = (itemInput as any).combo && (itemInput as any).selections;

    if (isComboResult) {
      // --- 1. XỬ LÝ COMBO (Luôn thêm dòng mới vì cấu hình combo phức tạp) ---
      const result = itemInput as ComboWithOptionsResult;
      const combo = result.combo;

      const newItem: OrderItemWithTempId = {
        tempId: this.generateTempId(), // <--- QUAN TRỌNG: ID duy nhất
        item: combo.id,
        itemType: 'Combo',
        name: combo.name,
        quantity: 1,
        basePrice: result.totalPrice,
        price: result.totalPrice,
        options: [],
        comboSelections: result.selections,
        note: result.note,
        image: combo.image || '',
      };
      newItems.push(newItem);
    } else if (isProductWithOption) {
      // --- 2. XỬ LÝ SẢN PHẨM CÓ OPTIONS (Luôn thêm dòng mới để tách biệt topping) ---
      // (Nếu muốn gộp các món y hệt options thì cần logic so sánh sâu mảng options, nhưng đơn giản nhất là thêm mới)
      const result = itemInput as ProductWithOptionsResult;
      const product = result.product;

      const newItem: OrderItemWithTempId = {
        tempId: this.generateTempId(), // <--- QUAN TRỌNG
        item: product.id,
        itemType: 'Product',
        name: product.name,
        quantity: 1,
        basePrice: (product as any)?.basePrice || 0,
        price: result.totalPrice,
        options: result.options,
        comboSelections: [],
        note: result.note,
        image: product?.image || '',
      };
      newItems.push(newItem);
    } else {
      // --- 3. XỬ LÝ SẢN PHẨM ĐƠN LẺ (Gộp nếu đã có sản phẩm đơn lẻ cùng loại) ---
      const product = itemInput as Product;

      const existingItemIndex = newItems.findIndex(
        (item) =>
          item.item === product.id &&
          item.itemType === 'Product' &&
          (!item.options || item.options.length === 0), // Chỉ gộp nếu không có options
      );

      if (existingItemIndex !== -1) {
        // Nếu đã có -> Tăng số lượng
        const updatedItem = { ...newItems[existingItemIndex] };
        updatedItem.quantity += 1;
        newItems[existingItemIndex] = updatedItem;
      } else {
        // Chưa có -> Thêm mới
        const newItem: OrderItemWithTempId = {
          tempId: this.generateTempId(), // <--- QUAN TRỌNG
          item: product.id,
          itemType: 'Product',
          name: product.name,
          quantity: 1,
          basePrice: (product as any)?.basePrice || 0,
          price: (product as any)?.basePrice || 0,
          options: [],
          comboSelections: [],
          note: '',
          image: product?.image || '',
        };
        newItems.push(newItem);
      }
    }

    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Dùng tempId để update
  public updateQuantity(tempId: string, newQuantity: number) {
    const state = this.getCurrentCart();

    // Nếu số lượng <= 0 thì xóa
    if (newQuantity <= 0) {
      this.removeItem(tempId);
      return;
    }

    // Update đúng item có tempId tương ứng
    const newItems = (state.items as OrderItemWithTempId[]).map((item) => {
      if (item.tempId === tempId) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    this.updateState({ ...state, items: newItems });
  }

  // SỬA: Dùng tempId để remove
  public removeItem(tempId: string) {
    const state = this.getCurrentCart();
    // Lọc bỏ item có tempId trùng khớp
    const newItems = (state.items as OrderItemWithTempId[]).filter(
      (item) => item.tempId !== tempId,
    );
    this.updateState({ ...state, items: newItems });
  }

  // ... (Các hàm setCustomer, setOrderType, setShippingFee... giữ nguyên)

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
    this.updateState({ ...state, orderType: type, shipping: null, shippingFee: 0 });
  }

  public setShippingFee(fee: number) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, shippingFee: fee });
  }

  public setDiscountValue(value: number) {
    const state = this.getCurrentCart();
    this.updateState({ ...state, discountValue: value || 0 });
  }

  public setDiscountType(type: 'fixed_amount' | 'percentage') {
    const state = this.getCurrentCart();
    this.updateState({ ...state, discountType: type });
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

  // --- LOGIC TÍNH TOÁN ---

  private updateState(newState: OrderFormData) {
    const stateWithTotals = this.calculateTotals(newState);
    this.cartState.next(stateWithTotals);
  }

  private calculateTotals(state: OrderFormData): OrderFormData {
    const totalAmount = state.items.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      return sum + price * item.quantity;
    }, 0);

    const discountValue = Number(state.discountValue || 0);
    let discountAmount = 0;
    if (state.discountType === 'percentage') {
      discountAmount = (totalAmount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    const grandTotal = Math.max(0, totalAmount - discountAmount + Number(state.shippingFee || 0));

    return { ...state, totalAmount, grandTotal };
  }
}
