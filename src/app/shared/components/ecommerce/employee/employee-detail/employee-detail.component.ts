import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Employee, EmployeeEmail, EmployeePhone } from '../../../../models/employee.model'; // Import thêm
import { EmployeeService } from '../../../../services/api/employee.service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

// --- (GIỮ NGUYÊN CÁC INTERFACE MOCK DATA) ---
interface OrderHistory {
  id: string;
  orderId: string;
  date: Date;
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  items: number;
}
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
// --- (HẾT PHẦN GIỮ NGUYÊN) ---

@Component({
  selector: 'app-employee-detail',
  imports: [CommonModule, RouterModule, HasPermissionDirective],
  templateUrl: './employee-detail.component.html',
  styles: ``,
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  loading = true;
  activeTab: 'overview' | 'orders' | 'loyalty' | 'activity' = 'overview';

  // THÊM MỚI: Thuộc tính để hiển thị email/phone chính
  displayEmail: EmployeeEmail | null = null;
  displayPhone: EmployeePhone | null = null;

  // --- (GIỮ NGUYÊN MOCK DATA VÀ STATS) ---
  orderHistory: OrderHistory[] = [];
  loyaltyPoints: LoyaltyPoint[] = [];
  activities: Activity[] = [];
  stats = {
    totalOrders: 0,
    totalSpent: 0,
    averageOrderValue: 0,
    loyaltyPoints: 0,
  };
  // --- (HẾT PHẦN GIỮ NGUYÊN) ---

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployeeDetail(id);
      this.loadOrderHistory(id); // (Bạn sẽ thay bằng API thật)
      this.loadLoyaltyPoints(id); // (Bạn sẽ thay bằng API thật)
      this.loadActivities(id); // (Bạn sẽ thay bằng API thật)
    }
  }

  loadEmployeeDetail(id: string): void {
    this.employeeService.getById(id).subscribe({
      next: (data) => {
        this.employee = data;

        // CẬP NHẬT: Logic tìm email/phone chính
        if (data.emails) {
          this.displayEmail = data.emails[0] || null;
        }
        if (data.phones) {
          this.displayPhone = data.phones[0] || null;
        }
        // Hết phần cập nhật

        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load employee details', 'Error');
        this.loading = false;
        this.router.navigate(['/employee/list']); // Sửa lại /list
      },
    });
  }

  // --- (GIỮ NGUYÊN CÁC HÀM loadOrderHistory, loadLoyaltyPoints, loadActivities) ---
  loadOrderHistory(employeeId: string): void {
    this.orderHistory = [
      {
        id: '1',
        orderId: 'ORD-2024-001',
        date: new Date('2024-10-05'),
        total: 1500000,
        status: 'completed',
        items: 3,
      },
      {
        id: '2',
        orderId: 'ORD-2024-002',
        date: new Date('2024-09-20'),
        total: 2300000,
        status: 'completed',
        items: 5,
      },
    ];
    this.stats.totalOrders = this.orderHistory.length;
    this.stats.totalSpent = this.orderHistory.reduce((sum, order) => sum + order.total, 0);
    this.stats.averageOrderValue =
      this.stats.totalSpent > 0 ? this.stats.totalSpent / this.stats.totalOrders : 0;
  }

  loadLoyaltyPoints(employeeId: string): void {
    this.loyaltyPoints = [
      {
        id: '1',
        points: 150,
        type: 'earned',
        description: 'Purchase order ORD-2024-001',
        date: new Date('2024-10-05'),
        orderId: '1',
      },
      {
        id: '2',
        points: -50,
        type: 'redeemed',
        description: 'Discount applied',
        date: new Date('2024-09-25'),
      },
    ];
    this.stats.loyaltyPoints = this.loyaltyPoints.reduce((sum, point) => sum + point.points, 0);
  }

  loadActivities(employeeId: string): void {
    this.activities = [
      {
        id: '1',
        type: 'order',
        description: 'Placed order ORD-2024-001',
        date: new Date('2024-10-05'),
      },
      {
        id: '2',
        type: 'login',
        description: 'Logged in to account',
        date: new Date('2024-10-04'),
      },
    ];
  }
  // --- (HẾT PHẦN GIỮ NGUYÊN) ---

  // --- (GIỮ NGUYÊN TẤT CẢ CÁC HÀM HELPER VÀ HANDLER) ---
  setActiveTab(tab: 'overview' | 'orders' | 'loyalty' | 'activity'): void {
    this.activeTab = tab;
  }

  formatDate(date?: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }

  formatDateTime(date?: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: 'short',
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
      male: 'Male',
      female: 'Female',
      other: 'Other',
    };
    return gender ? labels[gender] || '-' : '-';
  }

  getOrderStatusClass(status: string): string {
    const classes: any = {
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      processing: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      completed: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      cancelled: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return classes[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getOrderStatusLabel(status: string): string {
    const labels: any = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled',
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
    if (this.employee) {
      this.router.navigate(['/employee/edit', this.employee.id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/employee/list']); // Sửa lại /list
  }
}
