import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Order } from '../../../../models/order.model';
import { OrderService } from '../../../../services/api/order.service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

interface StatusHistory {
  id: string;
  status: string;
  timestamp: Date;
  updatedBy?: string;
  note?: string;
}

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule, RouterModule, HasPermissionDirective],
  templateUrl: './order-detail.component.html',
  styles: ``,
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  activeTab: 'overview' | 'items' | 'shipping' | 'payment' | 'history' = 'overview';

  // Mock status history - Replace with actual API calls
  statusHistory: StatusHistory[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadOrderDetail(id);
      this.loadStatusHistory(id);
    }
  }

  loadOrderDetail(id: string): void {
    this.orderService.getById(id, { populate: 'customer' }).subscribe({
      next: (data) => {
        this.order = data;
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('Failed to load order details', 'Error');
        this.loading = false;
        this.router.navigate(['/order/list']);
      },
    });
  }

  loadStatusHistory(orderId: string): void {
    // Replace with actual API call
    this.statusHistory = [
      {
        id: '1',
        status: 'pending',
        timestamp: new Date('2024-10-05T10:00:00'),
        updatedBy: 'System',
        note: 'Order created',
      },
      {
        id: '2',
        status: 'confirmed',
        timestamp: new Date('2024-10-05T10:30:00'),
        updatedBy: 'Admin',
        note: 'Order confirmed by admin',
      },
    ];
  }

  setActiveTab(tab: 'overview' | 'items' | 'shipping' | 'payment' | 'history'): void {
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

  parseFloat(value: any): number {
    const num = Number.parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  formatCurrency(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  }

  getOrderStatusClass(status: string): string {
    const classes: any = {
      pending:
        'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30',
      confirmed:
        'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30',
      preparing:
        'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30',
      delivering:
        'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
      completed:
        'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30',
      canceled:
        'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/30',
    };
    return (
      classes[status] ||
      'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/30'
    );
  }

  getOrderStatusLabel(status: string): string {
    const labels: any = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      delivering: 'Delivering',
      completed: 'Completed',
      canceled: 'Canceled',
    };
    return labels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    const classes: any = {
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      paid: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      failed: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return classes[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getPaymentStatusLabel(status: string): string {
    const labels: any = {
      pending: 'Pending',
      paid: 'Paid',
      failed: 'Failed',
    };
    return labels[status] || status;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: any = {
      cash: 'Cash on Delivery',
      momo: 'MoMo Wallet',
      vnpay: 'VNPay',
    };
    return labels[method] || method;
  }

  getShippingStatusClass(status: string): string {
    const classes: any = {
      pending: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      delivering: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      delivered: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      failed: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return classes[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getShippingStatusLabel(status: string): string {
    const labels: any = {
      pending: 'Pending',
      delivering: 'Delivering',
      delivered: 'Delivered',
      failed: 'Failed',
    };
    return labels[status] || status;
  }

  handleUpdateStatus(newStatus: any): void {
    if (!this.order) return;

    this.orderService.update(this.order.id, { status: newStatus }).subscribe({
      next: () => {
        if (this.order) {
          this.order.status = newStatus as any;
          this.toastr.success('Order status updated successfully', 'Order');
          this.loadStatusHistory(this.order.id);
        }
      },
      error: () => {
        this.toastr.error('Failed to update order status', 'Order');
      },
    });
  }

  handleConfirmPayment(): void {
    if (!this.order) return;

    this.orderService
      .update(this.order.id, {
        payment: { ...this.order.payment, status: 'paid' },
      })
      .subscribe({
        next: () => {
          if (this.order) {
            this.order.payment.status = 'paid';
            this.toastr.success('Payment confirmed successfully', 'Payment');
          }
        },
        error: () => {
          this.toastr.error('Failed to confirm payment', 'Payment');
        },
      });
  }

  handlePrintInvoice(): void {
    window.print();
  }

  handleSendMessage(): void {
    // Implement send message functionality
    this.toastr.info('Message feature coming soon', 'Info');
  }

  handleCreateShipping(): void {
    // Implement create shipping tracking
    this.toastr.info('Shipping tracking feature coming soon', 'Info');
  }

  goBack(): void {
    this.router.navigate(['/order/list']);
  }

  viewCustomer(): void {
    if (this.order && typeof this.order.customer === 'object') {
      this.router.navigate(['/customer/detail', this.order.customer.id]);
    }
  }
}
