import { Component, Input } from '@angular/core';
import { AuditLog } from '../../../models/audit-log.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  imports: [CommonModule],
})
export class OrderHistoryComponent {
  @Input() logs: AuditLog[] = [];

  // 1. Định nghĩa các Map dữ liệu
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
  };

  private paymentMethodMap: Record<string, string> = {
    cod: 'Tiền mặt (COD)',
    payos: 'Chuyển khoản / QR',
    momo: 'Ví MoMo',
  };

  // 2. Hàm xử lý hiển thị
  displayValue(field: string, value: any): string {
    if (value === null || value === undefined) return '---';

    // Xử lý theo từng loại field
    switch (field) {
      case 'status':
      case 'payment.status':
      case 'shipping.status':
        return this.statusMap[value] || value;

      case 'payment.method':
        return this.paymentMethodMap[value] || value;

      case 'is_active':
      case 'active':
        return value ? 'Kích hoạt' : 'Khóa';

      case 'totalAmount':
      case 'grandTotal':
      case 'shippingFee':
      case 'discountAmount':
        // Format tiền tệ (VND)
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

      default:
        return value;
    }
  }
}
