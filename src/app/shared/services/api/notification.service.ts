import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { SocketService } from '../socket.service';

// Định nghĩa Interface
export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string; // 'ORDER_NEW', 'SYSTEM', etc.
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceModel?: string;
}

export interface NotificationResponse {
  results: Notification[];
  page: number;
  totalPages: number;
  totalResults: number;
  // ...
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  // --- STATE MANAGEMENT ---
  // Lưu trữ danh sách thông báo để chia sẻ giữa các component
  private _notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this._unreadCount.asObservable();

  // Pagination State
  private currentPage = 1;
  private totalPages = 1;
  private isInitialized = false;
  private isLoading = false;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
  ) {
    // Tự động lắng nghe socket khi Service được khởi tạo (Singleton)
    this.initSocket();
  }

  // --- LOGIC KHỞI TẠO ---
  // Gọi hàm này từ Component. Nó sẽ chỉ fetch dữ liệu nếu chưa có.
  init() {
    if (!this.isInitialized) {
      this.fetchNotifications(1);
      this.fetchUnreadCount();
      this.isInitialized = true;
    }
  }

  // Làm mới dữ liệu (Pull to refresh hoặc khi có sự kiện lớn)
  refresh() {
    this.currentPage = 1;
    this.fetchNotifications(1);
    this.fetchUnreadCount();
  }

  // --- API CALLS & STATE UPDATE ---

  fetchNotifications(page: number) {
    if (this.isLoading) return;
    this.isLoading = true;

    const limit = 5;
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', 'createdAt:desc');

    this.http.get<NotificationResponse>(this.baseUrl, { params }).subscribe({
      next: (res) => {
        this.currentPage = res.page;
        this.totalPages = res.totalPages;

        if (page === 1) {
          // Trang 1: Gán mới hoàn toàn
          this._notifications.next(res.results);
        } else {
          // Trang > 1: Nối thêm vào danh sách cũ (Load more)
          const current = this._notifications.value;
          this._notifications.next([...current, ...res.results]);
        }
        this.isLoading = false;
      },
      error: () => (this.isLoading = false),
    });
  }

  loadMore() {
    if (this.currentPage < this.totalPages && !this.isLoading) {
      this.fetchNotifications(this.currentPage + 1);
    }
  }

  fetchUnreadCount() {
    this.http.get<{ unreadCount: number }>(`${this.baseUrl}/unread-count`).subscribe((res) => {
      this._unreadCount.next(res.unreadCount);
    });
  }

  // --- ACTIONS ---

  markAsRead(item: Notification) {
    // Optimistic Update: Cập nhật UI ngay lập tức
    if (!item.isRead) {
      item.isRead = true;
      const currentCount = this._unreadCount.value;
      this._unreadCount.next(Math.max(0, currentCount - 1));

      // Notify Angular change detection if needed by updating reference (optional)
      // this._notifications.next([...this._notifications.value]);

      // Gọi API background
      this.http.patch(`${this.baseUrl}/${item.id}/read`, {}).subscribe({
        error: () => {
          // Revert nếu lỗi (ít khi xảy ra)
          item.isRead = false;
          this._unreadCount.next(currentCount);
        },
      });
    }
  }

  markAllAsRead() {
    // Optimistic Update
    const currentList = this._notifications.value;
    currentList.forEach((n) => (n.isRead = true));
    this._notifications.next([...currentList]); // Trigger update UI
    this._unreadCount.next(0);

    this.http.patch(`${this.baseUrl}/read-all`, {}).subscribe();
  }

  // --- REALTIME SOCKET ---

  private initSocket() {
    this.socketService.connect();
    this.socketService.on('notification_received').subscribe((data: any) => {
      this.handleNewSocketNotification(data.payload);
    });
  }

  private handleNewSocketNotification(payload: any) {
    const newNotif: Notification = {
      ...payload,
      id: payload.id || payload._id,
      isRead: false,
    };

    // Thêm vào đầu danh sách hiện tại
    const current = this._notifications.value;
    this._notifications.next([newNotif, ...current]);

    // Tăng số lượng chưa đọc
    this._unreadCount.next(this._unreadCount.value + 1);

    // Phát âm thanh
    this.playNotificationSound();
  }

  private playNotificationSound() {
    const audio = new Audio('assets/sounds/notification.mp3');
    audio.play().catch((err) => console.error('Audio error', err));
  }

  // Helper getter để component biết còn trang để load không
  get hasMorePages(): boolean {
    return this.currentPage < this.totalPages;
  }

  get isLoadingData(): boolean {
    return this.isLoading;
  }
}
