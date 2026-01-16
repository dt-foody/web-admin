import { Component, Input } from '@angular/core';
import { AuditLog } from '../../../models/audit-log.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-history',
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
})
export class OrderHistoryComponent {
  @Input() logs: AuditLog[] = [];

  // --- Map dữ liệu ---
  private statusMap: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    preparing: 'Đang chuẩn bị',
    waiting_for_driver: 'Đang tìm tài xế',
    delivering: 'Đang giao',
    completed: 'Hoàn thành',
    canceled: 'Đã hủy',
    paid: 'Đã thanh toán',
    unpaid: 'Chưa thanh toán',
    refunded: 'Đã hoàn tiền',
    delivered: 'Đã giao hàng',
  };

  private paymentMethodMap: Record<string, string> = {
    cash: 'Tiền mặt',
    cod: 'COD (Thu hộ)',
    payos: 'Chuyển khoản / QR',
    momo: 'Ví MoMo',
  };

  // --- Hàm xử lý hiển thị ---
  displayValue(field: string, value: any): string {
    if (value === null || value === undefined) return '---';

    // 1. Xử lý trường hợp PAYMENT là Object
    // Dữ liệu: { method: 'cash', status: 'paid', ... }
    if (field === 'payment' && typeof value === 'object') {
      const method = this.paymentMethodMap[value.method] || value.method;
      const status = this.statusMap[value.status] || value.status;
      return `${method} (${status})`; // VD: Tiền mặt (Đã thanh toán)
    }

    // 2. Xử lý trường hợp SHIPPING là Object
    // Dữ liệu: { status: 'delivered', address: { recipientName: '...' } }
    if (field === 'shipping' && typeof value === 'object') {
      console.log('Shipping value:', value);
      const status = this.statusMap[value.status] || value.status;
      // Nếu muốn hiện thêm tên người nhận để dễ phân biệt
      const recipient = value.address?.recipientName ? ` - ${value.address.recipientName}` : '';
      return `${status}${recipient}`; // VD: Đã giao hàng - Lê Đình Hải
    }

    // 3. Xử lý các trường thông thường
    switch (field) {
      case 'status':
      case 'payment.status':
      case 'shipping.status':
        return this.statusMap[value] || value;

      case 'payment.method':
        return this.paymentMethodMap[value] || value;

      case 'totalAmount':
      case 'grandTotal':
      case 'shippingFee':
      case 'discountAmount':
      case 'surchargeAmount':
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

      default:
        // Nếu value vẫn là object (trường hợp chưa handle), chuyển thành JSON string để debug
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
    }
  }
}
