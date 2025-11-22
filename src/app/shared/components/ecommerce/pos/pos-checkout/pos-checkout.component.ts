import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';

import { PosStateService } from '../../../../services/api/pos.service';
import { OrderService } from '../../../../services/api/order.service';
import { Product } from '../../../../models/product.model';
import { Combo } from '../../../../models/combo.model';

import { ButtonComponent } from '../../../ui/button/button.component';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { Order } from '../../../../models/order.model';

@Component({
  selector: 'app-pos-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    ButtonComponent,
    LabelComponent,
    InputFieldComponent,
  ],
  templateUrl: './pos-checkout.component.html',
})
export class PosCheckoutComponent implements OnInit {
  @Input() products: Product[] = [];
  @Input() combos: Combo[] = [];

  public posState = inject(PosStateService);
  private orderService = inject(OrderService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  cart$ = this.posState.cartState$;

  // Dùng cho UI
  discountTypeOptions = [
    { value: 'fixed', label: 'Số tiền (đ)' },
    { value: 'percentage', label: 'Phần trăm (%)' },
  ];
  paymentMethods = [
    { value: 'cash', label: 'Tiền mặt' },
    { value: 'momo', label: 'MoMo' },
    { value: 'vnpay', label: 'VNPay' },
    { value: 'payos', label: 'PayOS' },
  ];

  isSubmitting = false;

  ngOnInit(): void {
    console.log('init checkout');
  }

  onDiscountTypeChange(type: 'fixed' | 'percentage') {
    this.posState.setDiscountType(type);
  }

  onDiscountValueChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.posState.setDiscountValue(value || 0);
  }

  onShippingFeeChange(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.posState.setShippingFee(value || 0);
  }

  onPaymentMethodChange(method: any) {
    this.posState.setPaymentMethod(method);
  }

  submitOrder() {
    if (this.isSubmitting) return;

    const cartState = this.posState.getCurrentCart();

    if (cartState.items.length === 0) {
      this.toastr.error('Giỏ hàng trống!');
      return;
    }

    // (Bạn có thể thêm validate địa chỉ nếu là 'Delivery' ở đây)
    if (cartState.orderType === 'Delivery') {
      const addr = cartState.shipping?.address;
      if (!addr?.recipientName || !addr.recipientPhone || !addr.street || !addr.city) {
        this.toastr.error('Vui lòng nhập đủ thông tin giao hàng', 'Lỗi');
        // (Bạn cần tạo UI cho việc nhập địa chỉ, ở đây tôi giả định là chưa có)
        // Thông thường POS sẽ không có giao hàng, nhưng logic của bạn có.
        // Tạm thời bỏ qua
      }
    }

    this.isSubmitting = true;

    // ----- ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT -----
    // 1. Lấy state (đã khớp cấu trúc)
    // 2. Gọi hàm build payload
    const payload = this.orderService.buildAdminOrderPayload(
      cartState as any,
      this.products,
      this.combos,
    );

    // 3. Gọi API
    this.orderService.adminCreateOrder(payload).subscribe({
      next: (order: Order) => {
        this.toastr.success('Tạo đơn hàng thành công!', 'Thành công');
        this.posState.resetCart();
        this.isSubmitting = false;
        // (Tùy chọn: Chuyển sang trang chi tiết đơn hàng)
        // this.router.navigate(['/order', order.id]);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err?.error?.message || 'Tạo đơn hàng thất bại', 'Lỗi');
        this.isSubmitting = false;
      },
    });
  }
}
