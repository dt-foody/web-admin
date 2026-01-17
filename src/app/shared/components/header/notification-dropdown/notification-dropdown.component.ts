import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NotificationService, Notification } from '../../../services/api/notification.service';
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Observable } from 'rxjs'; // Nhớ import Observable

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent],
  templateUrl: './notification-dropdown.component.html',
})
export class NotificationDropdownComponent implements OnInit {
  isOpen = false;

  // 1. Chỉ khai báo kiểu dữ liệu
  notifications$: Observable<Notification[]>;
  unreadCount$: Observable<number>;

  constructor(
    public notificationService: NotificationService,
    private router: Router,
  ) {
    // 2. Gán giá trị trong constructor
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {
    this.notificationService.init();
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  onNotificationClick(item: Notification) {
    this.notificationService.markAsRead(item);
    if (item.type === 'ORDER_NEW' && item.referenceId) {
      this.isOpen = false;
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
