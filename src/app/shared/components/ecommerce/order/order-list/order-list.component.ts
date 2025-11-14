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
import { Customer } from '../../../../models/customer.model'; // Giả định import

@Component({
  selector: 'app-order-list',
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
  styles: ``,
})
export class OrderListComponent extends BaseListComponent<Order> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  itemToDelete: Order | null = null;

  orderStatuses = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivering', label: 'Delivering' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  paymentStatuses = [
    { value: '', label: 'All Payment' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
  ];

  shippingStatuses = [
    { value: '', label: 'All Shipping' },
    { value: 'pending', label: 'Pending' },
    { value: 'delivering', label: 'Delivering' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
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
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'profile',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    // Add status filters
    if (this.query.status) {
      params.status = this.query.status;
    }

    // SỬA: Dùng "dot notation" để lọc các trường nested
    if (this.query.paymentStatus) {
      params['payment.status'] = this.query.paymentStatus;
    }
    if (this.query.shippingStatus) {
      // Giả sử model là shipping.status
      // Nếu model là shippingStatus (phẳng) thì dùng: params.shippingStatus = this.query.shippingStatus
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

  // SỬA: Ép kiểu profile sang Customer (hoặc User) nếu cần
  getCustomerPhone(profile: any): string | null {
    if (!profile) return null;

    // Giả định profile là Customer model
    if (profile.phones && profile.phones.length > 0) {
      return profile.phones[0].value;
    }

    // Giả định profile là User model
    if (profile.phone) {
      return profile.phone;
    }

    return null;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      confirmed: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      preparing: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400',
      delivering: 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
      completed: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      canceled: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
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

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

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

  handleUpdateStatus(order: Order, status: any): void {
    this.orderService.update(order.id, { status }).subscribe({
      next: () => {
        order.status = status as any;
        this.toastr.success('Status updated successfully!', 'Order');
      },
      error: () => {
        this.toastr.error('Failed to update status!', 'Order');
      },
    });
  }
}
