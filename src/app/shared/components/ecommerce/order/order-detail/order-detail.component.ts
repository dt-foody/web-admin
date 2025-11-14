import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTimelineComponent } from '../../../ui/status-timeline/status-timeline.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    NgSelectModule,
    StatusTimelineComponent,
    ButtonComponent,
  ],
  templateUrl: './order-detail.component.html',
  styles: ``,
})
export class OrderDetailComponent implements OnInit {
  // Dữ liệu order (giữ nguyên)
  public order: any = {
    orderId: 'ORD-2024-001',
    status: 'preparing',
    createdAt: '2024-11-09T10:30:00',
    updatedAt: '2024-11-09T14:20:00',
    note: 'Giao hàng trước 5h chiều',
    items: [
      { id: 1, name: 'Cà phê muối', price: 40000, quantity: 1, note: null },
      { id: 2, name: 'Phê muối sữa chua', price: 45000, quantity: 2, note: null },
      { id: 3, name: 'Cà phê nâu', price: 27000, quantity: 2, note: null },
      { id: 4, name: 'Cà phê đen', price: 27000, quantity: 2, note: null },
    ],
    profile: {
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0123456789',
    },
    shipping: {
      status: 'preparing',
      address: {
        recipientName: 'Nguyễn Văn A',
        recipientPhone: '0123456789',
        street: '123 Đường ABC',
        ward: 'Phường XYZ',
        district: 'Quận 1',
        city: 'TP. Hồ Chí Minh',
        label: 'Nhà riêng',
      },
    },
    payment: {
      method: 'cash',
      status: 'pending',
      transactionId: null,
    },
    totalAmount: 278000,
    discountAmount: 20000,
    shippingFee: 0,
    grandTotal: 258000,
  };

  // Các mảng trạng thái (giữ nguyên)
  public orderStatuses = [
    { key: 'pending', label: 'Chờ xác nhận', color: 'bg-yellow-500' },
    { key: 'confirmed', label: 'Đã xác nhận', color: 'bg-blue-500' },
    { key: 'preparing', label: 'Đang chuẩn bị', color: 'bg-purple-500' },
    { key: 'delivering', label: 'Đang giao', color: 'bg-indigo-500' },
    { key: 'completed', label: 'Hoàn thành', color: 'bg-green-500' },
    { key: 'canceled', label: 'Đã hủy', color: 'bg-red-500' },
  ];
  public shippingStatuses = [
    { key: 'pending', label: 'Chưa giao', color: 'bg-gray-400' },
    { key: 'preparing', label: 'Đang chuẩn bị', color: 'bg-yellow-500' },
    { key: 'in_transit', label: 'Đang vận chuyển', color: 'bg-blue-500' },
    { key: 'delivered', label: 'Đã giao', color: 'bg-green-500' },
  ];
  public paymentStatuses = [
    { key: 'pending', label: 'Chưa thanh toán', color: 'bg-yellow-500' },
    { key: 'paid', label: 'Đã thanh toán', color: 'bg-green-500' },
    { key: 'refunded', label: 'Đã hoàn tiền', color: 'bg-purple-500' },
  ];

  public filteredOrderStatuses: any[] = [];
  public orderStatusIndex: number = 0;

  constructor() {}

  ngOnInit() {
    this.filteredOrderStatuses = this.orderStatuses.filter((s) => s.key !== 'canceled');
    this.updateOrderStatusIndex();
  }

  // --- CÁC HÀM HELPER (giữ nguyên) ---
  private getCurrentStatusIndex(statuses: any[], currentStatus: string): number {
    return statuses.findIndex((s) => s.key === currentStatus);
  }

  public formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  public formatDateTime(date: string): string {
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // --- HÀM MỚI ĐỂ CẬP NHẬT TRẠNG THÁI ---
  private updateOrderStatusIndex() {
    this.orderStatusIndex = this.getCurrentStatusIndex(
      this.filteredOrderStatuses,
      this.order.status,
    );
  }

  public setOrderStatus(statusKey: string) {
    // Không cho phép set về trạng thái cũ hoặc set trạng thái đã hủy
    if (this.order.status === statusKey || statusKey === 'canceled') return;

    // (Tùy chọn) Không cho phép quay lui trạng thái
    // const newIndex = this.getCurrentStatusIndex(this.filteredOrderStatuses, statusKey);
    // if (newIndex < this.orderStatusIndex) return;

    console.log('Chuyển trạng thái đơn hàng sang:', statusKey);
    this.order.status = statusKey;
    this.updateOrderStatusIndex();
    // Tại đây bạn có thể gọi service để cập nhật lên server
    // this.orderService.updateStatus(this.order.orderId, statusKey).subscribe(...)
  }

  // Hàm trackBy để tối ưu *ngFor
  public trackByStatusKey(index: number, status: any): string {
    return status.key;
  }

  public handleStatusUpdate(newStatusKey: string) {
    // Logic này được chuyển từ component con ra component cha
    if (this.order.status === newStatusKey || newStatusKey === 'canceled') return;

    console.log('Chuyển trạng thái đơn hàng sang:', newStatusKey);
    this.order.status = newStatusKey;

    // Lưu ý: Vì this.order.status đã thay đổi,
    // [currentStatus]="order.status" sẽ tự động cập nhật component con.
  }
}
