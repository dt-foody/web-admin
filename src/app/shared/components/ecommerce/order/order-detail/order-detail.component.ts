import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTimelineComponent } from '../../../ui/status-timeline/status-timeline.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { NgSelectModule } from '@ng-select/ng-select';

import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../../../services/api/order.service';
import { ImageUrlPipe } from '../../../../pipe/image-url.pipe';
import { ImageFallbackDirective } from '../../../../directives/app-image-fallback.directive';
import { DialogService } from '@ngneat/dialog';

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
    ImageUrlPipe,
    ImageFallbackDirective,
  ],
  templateUrl: './order-detail.component.html',
  styles: ``,
})
export class OrderDetailComponent implements OnInit {
  @ViewChild('confirmCompleteTpl') confirmCompleteTpl!: TemplateRef<any>;
  // Biến lưu dialog ref để đóng khi cần
  private dialogRef: any;

  public order: any = null;
  public orderId: any = '';
  public isLoading: boolean = true;
  public profileData: any = null;

  // Các mảng trạng thái
  public orderStatuses = [
    { key: 'pending', label: 'Chờ xác nhận', color: 'bg-yellow-500' },
    { key: 'confirmed', label: 'Đã xác nhận', color: 'bg-blue-500' },
    { key: 'preparing', label: 'Đang chuẩn bị', color: 'bg-purple-500' },
    { key: 'waiting_for_driver', label: 'Đang tìm tài xế', color: 'bg-orange-500' },
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

  constructor(
    private orderService: OrderService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private dialog: DialogService,
  ) {}

  ngOnInit() {
    this.filteredOrderStatuses = this.orderStatuses.filter((s) => s.key !== 'canceled');

    // Lấy orderId từ route params
    this.route.params.subscribe((params) => {
      this.orderId = params['id'];
      this.loadOrderDetail();
    });
  }

  // Load chi tiết đơn hàng từ API
  private loadOrderDetail() {
    this.isLoading = true;

    this.orderService.getById(this.orderId).subscribe({
      next: (response) => {
        this.order = response;

        this.updateOrderStatusIndex();
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error('Không thể tải thông tin đơn hàng');
        console.error('Load order error:', error);
        this.isLoading = false;
      },
    });
  }

  // Cập nhật chỉ số trạng thái hiện tại
  private updateOrderStatusIndex() {
    if (!this.order) return;
    this.orderStatusIndex = this.getCurrentStatusIndex(
      this.filteredOrderStatuses,
      this.order.status,
    );
  }

  // Lấy index của trạng thái hiện tại
  private getCurrentStatusIndex(statuses: any[], currentStatus: string): number {
    return statuses.findIndex((s) => s.key === currentStatus);
  }

  // Xử lý khi click vào trạng thái mới từ timeline
  public handleStatusUpdate(newStatusKey: string) {
    if (!this.order) return;

    if (this.order.status === newStatusKey || newStatusKey === 'canceled') {
      return;
    }

    const currentIndex = this.getCurrentStatusIndex(this.filteredOrderStatuses, this.order.status);
    const newIndex = this.getCurrentStatusIndex(this.filteredOrderStatuses, newStatusKey);

    if (newIndex < currentIndex) {
      this.toastr.warning('Không thể quay lại trạng thái trước đó');
      return;
    }

    // XỬ LÝ KHI CHỌN "HOÀN THÀNH"
    if (newStatusKey === 'completed') {
      if (this.order?.payment?.status === 'paid') {
        // Trường hợp 1: Đã thanh toán -> Hoàn thành luôn (update cả shipping)
        this.processCompleteOrder(false);
      } else {
        // Trường hợp 2: Chưa thanh toán -> Hiện Popup xác nhận
        this.dialogRef = this.dialog.open(this.confirmCompleteTpl);
      }
      return;
    }

    // Các trạng thái khác update bình thường
    this.updateOrderStatus(newStatusKey);
  }

  public confirmPaymentAndComplete() {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
    this.processCompleteOrder(true); // true = update thêm payment status thành paid
  }

  private processCompleteOrder(updatePayment: boolean) {
    this.isLoading = true;

    // Payload cơ bản: Đổi trạng thái đơn + Đổi trạng thái vận chuyển
    const payload: any = {
      status: 'completed',
      shipping: {
        ...this.order.shipping,
        status: 'delivered', // Logic: Hoàn thành -> Shipping auto Delivered
      },
    };

    // Nếu cần xác nhận thanh toán (từ popup)
    if (updatePayment) {
      const updatedPayment = {
        ...this.order.payment,
        status: 'paid',
      };
      delete updatedPayment.qrCode; // Xóa QR thừa nếu có
      payload.payment = updatedPayment;
    }

    this.orderService.adminUpdateOrder(this.order.id, payload).subscribe({
      next: (response) => {
        const msg = updatePayment
          ? 'Đã xác nhận thanh toán và hoàn thành đơn hàng'
          : 'Đơn hàng đã hoàn thành';
        this.toastr.success(msg);
        this.loadOrderDetail();
      },
      error: (error) => {
        this.toastr.error('Cập nhật thất bại');
        console.error('Complete order error:', error);
        this.isLoading = false;
      },
    });
  }

  // Gọi API cập nhật trạng thái
  private updateOrderStatus(statusKey: string) {
    // Cập nhật UI optimistic
    this.order.status = statusKey;
    this.updateOrderStatusIndex();

    // Sử dụng order.id thay vì order.orderId cho API
    this.orderService.adminUpdateOrder(this.order.id, { status: statusKey }).subscribe({
      next: (response) => {
        this.toastr.success('Cập nhật trạng thái đơn hàng thành công');

        this.loadOrderDetail();
      },
      error: (error) => {
        this.toastr.error('Cập nhật trạng thái thất bại');
        console.error('Update status error:', error);
      },
    });
  }

  // Format tiền tệ
  public formatCurrency(amount: number): string {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  // Format ngày giờ
  public formatDateTime(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Get payment method label
  public getPaymentMethodLabel(method: string): string {
    const methods: any = {
      cash: 'Tiền mặt',
      momo: 'Ví MoMo',
      banking: 'Chuyển khoản',
      card: 'Thẻ tín dụng',
    };
    return methods[method] || method;
  }

  // Get option display text
  public getItemOptionsText(options: any[]): string {
    if (!options || options.length === 0) return '';
    return options.map((opt) => `${opt.groupName}: ${opt.optionName}`).join(' • ');
  }

  public handleCompletePreparation() {
    if (!this.order) return;

    // Logic: Nếu đang "preparing" -> chuyển sang "delivering" (Đang giao)
    // Tận dụng hàm handleStatusUpdate có sẵn để cập nhật trạng thái
    this.handleStatusUpdate('delivering');
  }

  // --- THÊM MỚI: Xử lý Thanh toán ---
  public handlePayment() {
    if (!this.order) return;

    // Tạo object payment mới với trạng thái 'paid'
    const updatedPayment = {
      ...this.order.payment,
      status: 'paid',
    };

    delete updatedPayment.qrCode;

    // Gọi API cập nhật (patch) thông tin payment
    this.isLoading = true; // Có thể bật loading nếu muốn chặn thao tác
    this.orderService.adminUpdateOrder(this.order.id, { payment: updatedPayment }).subscribe({
      next: (response) => {
        this.toastr.success('Xác nhận thanh toán thành công');
        // Reload lại dữ liệu để cập nhật UI đồng bộ
        this.loadOrderDetail();
      },
      error: (error) => {
        this.toastr.error('Lỗi khi cập nhật thanh toán');
        console.error('Payment update error:', error);
        this.isLoading = false;
      },
    });
  }
}
