import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StatusTimelineComponent } from '../../../ui/status-timeline/status-timeline.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { NgSelectModule } from '@ng-select/ng-select';

import { ToastrService } from 'ngx-toastr';
import { OrderService } from '../../../../services/api/order.service';

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
  public order: any = null;
  public isLoading: boolean = true;
  public profileData: any = null;

  // Các mảng trạng thái
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

  constructor(
    private orderService: OrderService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.filteredOrderStatuses = this.orderStatuses.filter((s) => s.key !== 'canceled');

    // Lấy orderId từ route params
    this.route.params.subscribe((params) => {
      const orderId = params['id'];
      if (orderId) {
        this.loadOrderDetail(orderId);
      } else {
        this.toastr.error('Không tìm thấy mã đơn hàng');
        this.isLoading = false;
      }
    });
  }

  // Load chi tiết đơn hàng từ API
  private loadOrderDetail(orderId: string) {
    this.isLoading = true;

    this.orderService.getById(orderId).subscribe({
      next: (response) => {
        // Lấy data từ response
        const orderData = response;

        // Debug: Log raw data để kiểm tra
        console.log('Raw order data:', orderData);
        console.log('orderCode:', orderData.orderCode);
        console.log('orderId:', orderData.orderId);
        console.log('id:', orderData.id);

        // Transform data để phù hợp với template
        this.order = this.transformOrderData(orderData);

        // Debug: Log transformed data
        console.log('Transformed order:', this.order);
        console.log('Final orderId:', this.order.orderId);

        this.updateOrderStatusIndex();
        this.isLoading = false;

        // Load profile data nếu cần
        if (orderData.profile && typeof orderData.profile === 'string') {
          this.loadProfileData(orderData.profile);
        }
      },
      error: (error) => {
        this.toastr.error('Không thể tải thông tin đơn hàng');
        console.error('Load order error:', error);
        this.isLoading = false;
      },
    });
  }

  // Transform order data từ API sang format của template
  private transformOrderData(apiOrder: any): any {
    // Kiểm tra apiOrder có tồn tại không
    if (!apiOrder) {
      console.error('API Order is null or undefined');
      return null;
    }

    // Lấy orderId ưu tiên: orderCode > orderId > _id > id
    const displayOrderId =
      apiOrder.orderCode || apiOrder.orderId || apiOrder._id || apiOrder.id || 'N/A';

    console.log('Display Order ID:', displayOrderId);

    // Transform profile - xử lý cả object và string ID
    let profileData: any = {
      id: '',
      name: 'Khách hàng',
      email: '',
      phone: '',
    };

    if (apiOrder.profile) {
      if (typeof apiOrder.profile === 'object') {
        // Profile là object
        profileData = {
          id: apiOrder.profile.id || apiOrder.profile._id || '',
          name:
            apiOrder.profile.name ||
            apiOrder.profile.fullName ||
            apiOrder.profile.username ||
            apiOrder.shipping?.address?.recipientName ||
            'Khách hàng',
          email: apiOrder.profile.email || '',
          phone:
            apiOrder.profile.phone ||
            apiOrder.profile.phoneNumber ||
            apiOrder.shipping?.address?.recipientPhone ||
            '',
        };
      } else {
        // Profile là string ID
        profileData = {
          id: apiOrder.profile,
          name: apiOrder.shipping?.address?.recipientName || 'Khách hàng',
          email: '',
          phone: apiOrder.shipping?.address?.recipientPhone || '',
        };
      }
    }

    return {
      // ID fields - Format giống mock data
      id: apiOrder.id || apiOrder._id,
      orderId: displayOrderId,

      // Status
      status: apiOrder.status || 'pending',

      // Timestamps
      createdAt: apiOrder.createdAt || apiOrder.created_at || new Date().toISOString(),
      updatedAt: apiOrder.updatedAt || apiOrder.updated_at || new Date().toISOString(),

      // Note
      note: apiOrder.note || '',

      // Items - transform để match format mock
      items: (apiOrder.items || []).map((item: any, index: number) => ({
        id: item.item || item.id || item._id || index,
        name: item.name || 'Sản phẩm',
        price: item.price || item.basePrice || 0,
        originalPrice: item.originalBasePrice || item.originalPrice || item.price || 0,
        quantity: item.quantity || 1,
        note: item.note || null,
        options: item.options || [],
        comboSelections: item.comboSelections || [],
        promotion: item.promotion || null,
      })),

      // Profile - format giống mock data
      profile: {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      },

      // Shipping - format giống mock data
      shipping: {
        status: apiOrder.shipping?.status || 'pending',
        address: {
          recipientName: apiOrder.shipping?.address?.recipientName || profileData.name,
          recipientPhone: apiOrder.shipping?.address?.recipientPhone || profileData.phone,
          street: apiOrder.shipping?.address?.street || '',
          ward: apiOrder.shipping?.address?.ward || '',
          district: apiOrder.shipping?.address?.district || '',
          city: apiOrder.shipping?.address?.city || '',
          label: apiOrder.shipping?.address?.label || 'Địa chỉ',
          location: apiOrder.shipping?.address?.location || null,
        },
      },

      // Payment - format giống mock data
      payment: {
        method: apiOrder.payment?.method || 'cash',
        status: apiOrder.payment?.status || 'pending',
        transactionId: apiOrder.payment?.transactionId || null,
      },

      // Financial - format giống mock data
      totalAmount: apiOrder.totalAmount || 0,
      discountAmount: apiOrder.discountAmount || 0,
      shippingFee: apiOrder.shippingFee || 0,
      grandTotal: apiOrder.grandTotal || 0,

      // Additional fields
      orderType: apiOrder.orderType || '',
      profileType: apiOrder.profileType || 'Customer',
      deliveryTime: apiOrder.deliveryTime || null,
      appliedCoupons: apiOrder.appliedCoupons || [],
      createdBy: apiOrder.createdBy || null,
    };
  }

  // Load profile data riêng nếu cần
  private loadProfileData(profileId: string) {
    // Nếu có API để lấy profile detail
    // this.profileService.getProfileById(profileId).subscribe({
    //   next: (profile) => {
    //     if (this.order) {
    //       this.order.profile = {
    //         id: profile.id,
    //         name: profile.name,
    //         email: profile.email,
    //         phone: profile.phone
    //       };
    //     }
    //   },
    //   error: (err) => console.error('Load profile error:', err)
    // });
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

    // Không cho phép quay lại trạng thái cũ hoặc chuyển sang canceled
    if (this.order.status === newStatusKey || newStatusKey === 'canceled') {
      return;
    }

    // Kiểm tra không cho phép nhảy cóc trạng thái (optional)
    const currentIndex = this.getCurrentStatusIndex(this.filteredOrderStatuses, this.order.status);
    const newIndex = this.getCurrentStatusIndex(this.filteredOrderStatuses, newStatusKey);

    if (newIndex < currentIndex) {
      this.toastr.warning('Không thể quay lại trạng thái trước đó');
      return;
    }

    // Gọi API cập nhật trạng thái
    this.updateOrderStatus(newStatusKey);
  }

  // Gọi API cập nhật trạng thái
  private updateOrderStatus(statusKey: string) {
    const oldStatus = this.order.status;

    // Cập nhật UI optimistic
    this.order.status = statusKey;
    this.updateOrderStatusIndex();

    // Sử dụng order.id thay vì order.orderId cho API
    this.orderService.adminUpdateOrder(this.order.id, { status: statusKey }).subscribe({
      next: (response) => {
        this.toastr.success('Cập nhật trạng thái đơn hàng thành công');

        // Cập nhật lại toàn bộ order từ response nếu có
        if (response.data) {
          this.order = this.transformOrderData(response.data);
          this.updateOrderStatusIndex();
        }
      },
      error: (error) => {
        this.toastr.error('Cập nhật trạng thái thất bại');
        console.error('Update status error:', error);

        // Revert lại trạng thái cũ nếu lỗi
        this.order.status = oldStatus;
        this.updateOrderStatusIndex();
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

  // TrackBy cho performance
  public trackByStatusKey(index: number, status: any): string {
    return status.key;
  }

  public trackByItemId(index: number, item: any): string {
    return item.id;
  }
}
