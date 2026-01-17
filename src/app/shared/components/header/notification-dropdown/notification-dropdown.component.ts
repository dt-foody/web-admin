import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, Notification } from '../../../services/api/notification.service';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent],
  templateUrl: './notification-dropdown.component.html',
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = false;

  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;

  constructor(
    public notificationService: NotificationService,
    private router: Router,
  ) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    this.notificationService.init();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  /**
   * Hành động 1: Chỉ đánh dấu là đã đọc (khi click vào vùng trống của thông báo)
   */
  onMarkAsReadOnly(item: Notification) {
    if (!item.isRead) {
      this.notificationService.markAsRead(item);
    }
    // Không đóng dropdown, không navigate
  }

  /**
   * Hành động 2: Chuyển tới trang chi tiết (khi click vào icon con mắt)
   */
  onNavigateToOrder(event: Event, item: Notification) {
    event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài (để tránh gọi hàm onMarkAsReadOnly nếu không muốn conflict logic)

    // Tùy chọn: Có thể mark as read luôn khi chuyển trang nếu muốn
    if (!item.isRead) {
      this.notificationService.markAsRead(item);
    }

    if (item.type === 'ORDER_NEW' && item.referenceId) {
      this.isOpen = false; // Đóng dropdown
      this.router.navigate(['/order/detail', item.referenceId]);
    }
  }

  onMarkAllRead(event: Event) {
    event.stopPropagation();
    this.notificationService.markAllAsRead();
  }

  onLoadMore(event: Event) {
    event.stopPropagation();
    this.notificationService.loadMore();
  }

  formatTime(dateString: string): string {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
  }
}
