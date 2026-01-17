import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Customer, CustomerEmail, CustomerPhone } from '../../../../models/customer.model';
import { CustomerService } from '../../../../services/api/customer.service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { OrderService } from '../../../../services/api/order.service';
import { Order } from '../../../../models/order.model';

interface LoyaltyPoint {
  id: string;
  points: number;
  type: 'earned' | 'redeemed';
  description: string;
  date: Date;
  orderId?: string;
}
interface Activity {
  id: string;
  type: 'order' | 'login' | 'profile_update' | 'address_added' | 'review';
  description: string;
  date: Date;
}

@Component({
  selector: 'app-customer-detail',
  imports: [CommonModule, RouterModule, HasPermissionDirective],
  templateUrl: './customer-detail.component.html',
  styles: ``,
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  loading = true;
  activeTab: 'overview' | 'orders' | 'activity' = 'orders';

  displayEmail: CustomerEmail | null = null;
  displayPhone: CustomerPhone | null = null;

  orderList: Order[] = [];
  loyaltyPoints: LoyaltyPoint[] = [];
  activities: Activity[] = [];

  queryOrder = { page: 1, limit: 10, profile: '' };
  totalPagesOrder = 0;
  totalResultsOrder = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private orderService: OrderService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCustomerDetail(id);
      this.loadOrderHistory(id);
      this.loadLoyaltyPoints(id);
      this.loadActivities(id);
    }
  }

  loadCustomerDetail(id: string): void {
    this.customerService.getById(id).subscribe({
      next: (data) => {
        this.customer = data;

        if (data.emails) {
          this.displayEmail = data.emails[0] || null;
        }
        if (data.phones) {
          this.displayPhone = data.phones[0] || null;
        }

        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Không thể tải thông tin khách hàng', 'Lỗi');
        this.loading = false;
        this.router.navigate(['/customer/list']);
      },
    });
  }

  loadOrderHistory(customerId: string): void {
    this.queryOrder.profile = customerId;
    this.orderService.getAll(this.queryOrder).subscribe({
      next: (data) => {
        this.orderList = data.results;
        this.totalPagesOrder = data.totalPages;
        this.totalResultsOrder = data.totalResults;
      },
      error: (error) => {},
    });
  }

  loadLoyaltyPoints(customerId: string): void {
    this.loyaltyPoints = [
      {
        id: '1',
        points: 150,
        type: 'earned',
        description: 'Đơn hàng ORD-2024-001',
        date: new Date('2024-10-05'),
        orderId: '1',
      },
      {
        id: '2',
        points: -50,
        type: 'redeemed',
        description: 'Áp dụng mã giảm giá',
        date: new Date('2024-09-25'),
      },
    ];
  }

  loadActivities(customerId: string): void {
    this.activities = [
      {
        id: '1',
        type: 'order',
        description: 'Đã đặt đơn hàng ORD-2024-001',
        date: new Date('2024-10-05'),
      },
      {
        id: '2',
        type: 'login',
        description: 'Đăng nhập vào tài khoản',
        date: new Date('2024-10-04'),
      },
    ];
  }

  setActiveTab(tab: 'overview' | 'orders' | 'activity'): void {
    this.activeTab = tab;
  }

  formatDate(date?: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  }

  formatDateTime(date?: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  getGenderLabel(gender?: string): string {
    const labels: any = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác',
    };
    return gender ? labels[gender] || '-' : '-';
  }
  getOrderStatusClass(status: string): string {
    const classes: any = {
      // 1. Nhóm khởi tạo/chờ
      unfinished: 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400', // Xám
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400', // Vàng (Cảnh báo nhẹ)

      // 2. Nhóm xử lý bếp/nhà hàng
      confirmed: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400', // Xanh dương (Thông tin)
      preparing: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400', // Tím (Đang làm việc)

      // 3. Nhóm giao vận
      waiting_for_driver: 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400', // Cam (Cần chú ý)
      delivering: 'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-400', // Xanh lơ (Đang di chuyển)

      // 4. Trạng thái cuối
      completed: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400', // Xanh lá (Thành công)
      canceled: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400', // Đỏ (Thất bại)
    };

    // Mặc định trả về màu xám nếu không tìm thấy key
    return classes[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getOrderStatusLabel(status: string): string {
    const labels: any = {
      unfinished: 'Chưa hoàn tất',
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      waiting_for_driver: 'Đang tìm tài xế',
      delivering: 'Đang giao hàng',
      completed: 'Hoàn thành',
      canceled: 'Đã hủy',
    };
    return labels[status] || status;
  }

  getActivityIcon(type: string): string {
    const icons: any = {
      order: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      login:
        'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1',
      profile_update: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      address_added:
        'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
      review:
        'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    };
    return icons[type] || icons['order'];
  }

  handleEdit(): void {
    if (this.customer) {
      this.router.navigate(['/customer/edit', this.customer.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/customer/list']);
  }

  calculateAverageOrderValue(): any {
    if (this.customer && this.customer.totalSpent && this.customer.totalOrder) {
      return this.formatCurrency(Math.round(this.customer.totalSpent / this.customer.totalOrder));
    } else {
      return '---';
    }
  }
}
