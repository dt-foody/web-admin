import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, TemplateRef, ViewChild, ElementRef } from '@angular/core';
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
import { DndModule, DndDropEvent } from 'ngx-drag-drop';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    CheckboxComponent,
    HasPermissionDirective,
    DndModule,
  ],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent extends BaseListComponent<Order> implements OnInit, OnDestroy {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  viewMode: 'table' | 'kanban' = 'table';
  itemToDelete: Order | null = null;
  
  private refreshSubscription: Subscription | null = null;

  sortOptions = [
    { label: 'Mới nhất', value: 'createdAt:desc' },
    { label: 'Cũ nhất', value: 'createdAt:asc' },
    { label: 'Vừa cập nhật', value: 'updatedAt:desc' },
    { label: 'Ưu tiên cao nhất (Gấp)', value: 'priorityTime:asc' }, 
    { label: 'Ưu tiên thấp nhất', value: 'priorityTime:desc' },
  ];
  
  currentSortValue: string = 'priorityTime:asc';

  get kanbanColumns() {
    // Loại trừ 'unfinished' khỏi các cột Kanban để tránh hiển thị cột tổng hợp thừa
    return this.orderStatuses.filter((s) => s.value !== '' && s.value !== 'unfinished');
  }

  orderStatuses = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'unfinished', label: 'Chưa hoàn tất' }, // [MỚI] Thêm trạng thái chưa hoàn tất
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'preparing', label: 'Đang chuẩn bị' },
    { value: 'delivering', label: 'Đang giao hàng' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'canceled', label: 'Đã hủy' },
  ];

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
    
    this.query.sort = { key: 'priorityTime', asc: true };

    const savedMode = localStorage.getItem('orderViewMode');
    if (savedMode === 'kanban') {
      this.viewMode = 'kanban';
    }
    
    this.manageAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  manageAutoRefresh() {
    this.stopAutoRefresh(); 
    
    if (this.viewMode === 'kanban') {
      this.refreshSubscription = interval(30000).subscribe(() => {
        this.fetchData();
      });
    }
  }

  stopAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = null;
    }
  }

  onSortOptionChange() {
    if (this.currentSortValue) {
      const [key, direction] = this.currentSortValue.split(':');
      this.query.sort = {
        key: key,
        asc: direction === 'asc'
      };
      this.onFilterChange();
    }
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.viewMode === 'kanban' ? 50 : this.query.pageSize,
      populate: 'profile',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    // [MỚI] Xử lý logic lọc trạng thái
    if (this.query.status) {
      if (this.query.status === 'unfinished') {
        // Nếu chọn "Chưa hoàn tất", gửi danh sách các trạng thái đang active
        params.status = ['pending', 'confirmed', 'preparing', 'delivering'];
      } else {
        // Các trường hợp khác gửi giá trị đơn lẻ
        params.status = this.query.status;
      }
    }

    if (this.query.paymentStatus) {
      params.paymentStatus = this.query.paymentStatus;
    }
    if (this.query.shippingStatus) {
      params.shippingStatus = this.query.shippingStatus;
    }

    this.orderService.getAll(params).subscribe({
      next: (data) => {
        this.dataSources = data.results;
        this.totalPages = data.totalPages;
        this.totalResults = data.totalResults;
      },
      error: (error) => {
      },
    });
  }

  setViewMode(mode: 'table' | 'kanban') {
    this.viewMode = mode;
    localStorage.setItem('orderViewMode', mode);
    this.query.page = 1;
    this.manageAutoRefresh();
    this.fetchData();
  }

  getOrdersByStatus(status: string): Order[] {
    return this.dataSources.filter((order) => order.status === status);
  }

  onDrop(event: DndDropEvent, targetStatus: string) {
    const order = event.data as Order;
    if (!order || order.status === targetStatus) return;

    const oldStatus = order.status;
    const targetOrder = this.dataSources.find((o) => o.id === order.id);
    if (targetOrder) {
      targetOrder.status = targetStatus as any;
    }

    this.orderService.adminUpdateOrder(order.id, { status: targetStatus }).subscribe({
      next: () => {
        this.toastr.success(`Đã cập nhật trạng thái thành công`, 'Thành công');
      },
      error: (err) => {
        if (targetOrder) {
          targetOrder.status = oldStatus;
        }
        this.toastr.error('Cập nhật trạng thái thất bại', 'Lỗi');
      },
    });
  }

  getPaymentStatusLabel(status?: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ thanh toán',
      paid: 'Đã thanh toán',
      failed: 'Thanh toán thất bại',
    };
    return map[status || ''] || 'đang chờ';
  }

  getOrderStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      preparing: 'Đang chuẩn bị',
      delivering: 'Đang giao hàng',
      completed: 'Hoàn thành',
      canceled: 'Đã hủy',
    };
    return map[status] || 'Không rõ';
  }

  getShippingStatusLabel(status?: string, orderType?: string): string {
    const map: Record<string, string> = {
      pending: 'Chờ vận chuyển',
      delivering: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      failed: 'Giao hàng thất bại',
    };
    if (!status && orderType !== 'Delivery') return 'n/a';
    return map[status || ''] || 'đang chờ';
  }

  getStatusDotColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-purple-500',
      delivering: 'bg-indigo-500',
      completed: 'bg-green-500',
      canceled: 'bg-red-500',
      refunded: 'bg-pink-500',
    };
    return colors[status] || 'bg-gray-500';
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
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700',
      confirmed: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700',
      preparing: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700',
      delivering: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700',
      completed: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700',
      canceled: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200';
  }

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
