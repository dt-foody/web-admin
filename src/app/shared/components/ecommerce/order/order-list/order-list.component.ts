import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Order } from '../../../../models/order.model';
import { OrderService } from '../../../../services/api/order.service';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { CheckboxComponent } from '../../../form/input/checkbox.component';

@Component({
  selector: 'app-order-list',
  standalone: true, // Đảm bảo standalone nếu project dùng Angular 17+
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    CheckboxComponent,
    HasPermissionDirective,
  ],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent extends BaseListComponent<Order> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  // Thêm biến viewMode, mặc định là 'table'
  viewMode: 'table' | 'kanban' = 'table';

  itemToDelete: Order | null = null;

  orderStatuses = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'delivering', label: 'Đang giao hàng' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'canceled', label: 'Đã hủy' },
  ];

  // Getter để lấy danh sách cột cho Kanban (bỏ option 'All Status')
  get kanbanColumns() {
    return this.orderStatuses.filter((s) => s.value !== '');
  }

  paymentStatuses = [
    { value: '', label: 'Tất cả thanh toán' },
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'failed', label: 'Thanh toán thất bại' },
  ];

  shippingStatuses = [
    { value: '', label: 'Tất cả vận chuyển' },
    { value: 'pending', label: 'Chờ vận chuyển' },
    { value: 'delivering', label: 'Đang giao hàng' },
    { value: 'delivered', label: 'Đã giao hàng' },
    { value: 'failed', label: 'Giao hàng thất bại' },
  ];

  constructor(
    private orderService: OrderService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.query.status = '';
    this.query.paymentStatus = '';
    this.query.shippingStatus = '';

    // Có thể load viewMode từ localStorage nếu muốn nhớ trạng thái
    const savedMode = localStorage.getItem('orderViewMode');
    if (savedMode === 'kanban') this.viewMode = 'kanban';
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      // Nếu ở chế độ Kanban, có thể bạn muốn load nhiều item hơn (ví dụ 50)
      limit: this.viewMode === 'kanban' ? 50 : this.query.pageSize,
      populate: 'profile',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }
    if (this.query.status) {
      params.status = this.query.status;
    }
    if (this.query.paymentStatus) {
      params['payment.status'] = this.query.paymentStatus;
    }
    if (this.query.shippingStatus) {
      params['shipping.status'] = this.query.shippingStatus;
    }

    this.orderService.getAll(params).subscribe({
      next: (data) => {
        this.dataSources = data.results;
        this.totalPages = data.totalPages;
        this.totalResults = data.totalResults;
      },
      error: (error) => {
        this.toastr.error('Failed to fetch data!', 'Order');
      },
    });
  }

  // Hàm chuyển đổi chế độ xem
  setViewMode(mode: 'table' | 'kanban') {
    this.viewMode = mode;
    localStorage.setItem('orderViewMode', mode);

    // Reload data để áp dụng limit mới nếu cần
    this.query.page = 1;
    this.fetchData();
  }

  // Helper lấy orders cho từng cột Kanban từ data hiện tại
  getOrdersByStatus(status: string): Order[] {
    return this.dataSources.filter((order) => order.status === status);
  }

  getCustomerPhone(profile: any): string | null {
    if (!profile) return null;
    if (profile.phones && profile.phones.length > 0) {
      return profile.phones[0].value;
    }
    if (profile.phone) {
      return profile.phone;
    }
    return null;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending:
        'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700',
      confirmed:
        'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700',
      preparing:
        'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700',
      delivering:
        'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700',
      completed:
        'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700',
      canceled:
        'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
    };
    return (
      colors[status] ||
      'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200'
    );
  }

  // ... (Giữ nguyên các hàm getPaymentStatusColor, getShippingStatusColor, getItemsCount, handle...)

  // Giữ nguyên logic cũ
  getPaymentStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      paid: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      failed: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getShippingStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      delivering: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      delivered: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      failed: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getItemsCount(order: Order): number {
    return order.items?.length || 0;
  }

  onFilterChange() {
    this.query.page = 1;
    this.fetchData();
  }

  handleView(order: Order): void {
    this.router.navigate(['/order/detail', order.id]);
  }

  handleEdit(order: Order): void {
    this.router.navigate(['/order/edit', order.id]);
  }

  handleDelete(order: Order): void {
    this.itemToDelete = order;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl, { data: {} });
    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.orderService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Delete successfully!', 'Order');
          this.fetchData();
        });
      }
      this.itemToDelete = null;
    });
  }
}
