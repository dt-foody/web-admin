import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Customer } from '../../../../models/customer.model';
import { OrderPayment, Order } from '../../../../models/order.model';
import { OrderService } from '../../../../services/api/order.service';
import { PosStateService } from '../../../../services/api/pos.service';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ButtonComponent } from '../../../ui/button/button.component';

@Component({
  selector: 'app-pos-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputFieldComponent],
  templateUrl: './pos-checkout.component.html',
})
export class PosCheckoutComponent {
  public posState = inject(PosStateService);
  private orderService = inject(OrderService);
  private toastr = inject(ToastrService);

  cart$ = this.posState.cartState$;

  discount: number = 0;
  shippingFee: number = 0;
  paymentMethod: OrderPayment['method'] = 'cash';
  isSubmitting = false;

  onDiscountChange() {
    this.posState.setDiscount(this.discount || 0);
  }

  onShippingFeeChange() {
    this.posState.setShippingFee(this.shippingFee || 0);
  }

  onSelectPayment(method: OrderPayment['method']) {
    this.paymentMethod = method;
    this.posState.setPaymentMethod(method);
  }

  onCompleteOrder() {
    this.isSubmitting = true;
    const cart = this.posState.getCurrentCart();

    // 1. Validate
    if (cart.items.length === 0) {
      this.toastr.error('Giỏ hàng đang trống', 'Lỗi');
      this.isSubmitting = false;
      return;
    }

    if (cart.orderType === 'Delivery' && (!cart.shipping || !cart.shipping.address.recipientName)) {
      this.toastr.error('Vui lòng nhập thông tin giao hàng', 'Lỗi');
      this.isSubmitting = false;
      return;
    }

    // 2. Build Payload
    // Dùng Partial<Order> để tạo payload, chỉ gửi những gì cần thiết
    const payload: Partial<Order> = {
      profile: cart.customer ? (cart.customer as Customer).id || cart.customer : undefined,
      profileType: cart.customer ? 'Customer' : undefined,
      items: cart.items,
      totalAmount: cart.totalAmount,
      discountAmount: cart.discountAmount,
      shippingFee: cart.shippingFee,
      grandTotal: cart.grandTotal,
      payment: {
        ...cart.payment,
        method: this.paymentMethod,
        status: 'paid', // POS luôn là 'paid'
      },
      shipping: cart.shipping ? cart.shipping : undefined, // Gửi null/undefined nếu không có
      note: cart.note,
      channel: 'POS',
      orderType: cart.orderType,
      status: 'completed', // Đơn POS luôn hoàn thành
    };

    // 3. Gọi API
    this.orderService.create(payload as any).subscribe({
      next: (order: any) => {
        this.toastr.success(`Tạo đơn hàng #${order.orderCode || order.orderId} thành công!`);
        this.posState.resetCart();
        this.discount = 0;
        this.shippingFee = 0;
        this.paymentMethod = 'cash';
        this.isSubmitting = false;
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Không thể tạo đơn hàng');
        this.isSubmitting = false;
      },
    });
  }
}
