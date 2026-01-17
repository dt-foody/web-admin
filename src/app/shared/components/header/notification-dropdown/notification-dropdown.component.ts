import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService, Notification } from '../../../services/api/notification.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale'; // Cần cài: npm install date-fns
import { DropdownComponent } from '../../ui/dropdown/dropdown.component';
import { DropdownItemComponent } from '../../ui/dropdown/dropdown-item/dropdown-item.component';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterModule, DropdownComponent, DropdownItemComponent],
  templateUrl: './notification-dropdown.component.html',
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isOpen: boolean = false;

  private socketSubscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
  ) {}

  ngOnInit(): void {
    // 1. Kết nối socket
    this.socketService.connect();

    // 2. Lấy dữ liệu ban đầu
    this.fetchNotifications();
    this.fetchUnreadCount();

    // 3. Lắng nghe Realtime
    this.socketSubscription = this.socketService
      .on('notification_received')
      .subscribe((data: any) => {
        this.handleNewNotification(data.payload);
      });
  }

  ngOnDestroy(): void {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    // Không disconnect socket ở đây nếu bạn muốn nó chạy toàn app (ví dụ ở app.component)
    // Nếu chỉ chạy ở component này thì: this.socketService.disconnect();
  }

  // --- API CALLS ---

  fetchNotifications() {
    this.notificationService.getNotifications(1, 5).subscribe((res) => {
      this.notifications = res.results;
    });
  }

  fetchUnreadCount() {
    this.notificationService.getUnreadCount().subscribe((res) => {
      this.unreadCount = res.unreadCount;
    });
  }

  // --- ACTIONS ---

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  markAsRead(item: Notification) {
    if (item.isRead) return;

    this.notificationService.markAsRead(item.id).subscribe(() => {
      item.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  markAllRead() {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notifications.forEach((n) => (n.isRead = true));
      this.unreadCount = 0;
    });
  }

  // --- HANDLERS ---

  handleNewNotification(payload: any) {
    // Backend trả về object Notification mới
    // Thêm vào đầu danh sách
    const newNotif: Notification = {
      ...payload,
      id: payload.id || payload._id, // Map ID từ mongo
      isRead: false,
    };

    this.notifications.unshift(newNotif);

    // Giới hạn danh sách hiển thị 5 item
    if (this.notifications.length > 5) {
      this.notifications.pop();
    }

    // Tăng count và phát âm thanh (nếu cần)
    this.unreadCount++;
    this.playNotificationSound();
  }

  playNotificationSound() {
    const audio = new Audio('assets/sounds/notification.mp3'); // Đảm bảo có file này
    audio.play().catch((e) => console.log('Audio play failed', e));
  }

  // Helper format time
  formatTime(dateString: string): string {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: vi });
  }
}
