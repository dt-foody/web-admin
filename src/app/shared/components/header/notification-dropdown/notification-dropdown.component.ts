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

  // [NEW] Hàm xử lý bật tắt âm thanh
  toggleSound(event: Event) {
    event.stopPropagation(); // Ngăn dropdown đóng lại
    const isChecked = (event.target as HTMLInputElement).checked;
    this.notificationService.toggleSound(isChecked);
  }

  onMarkAsReadOnly(item: Notification) {
    if (!item.isRead) {
      this.notificationService.markAsRead(item);
    }
  }

  onNavigateToOrder(event: Event, item: Notification) {
    event.stopPropagation();

    if (!item.isRead) {
      this.notificationService.markAsRead(item);
    }

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
