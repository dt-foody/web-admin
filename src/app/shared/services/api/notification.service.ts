import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from '../socket.service';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string; // 'ORDER_NEW', 'SYSTEM', etc.
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  referenceId?: string;
  referenceModel?: string;
}

export interface NotificationResponse {
  results: Notification[];
  page: number;
  totalPages: number;
  totalResults: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  // --- STATE MANAGEMENT ---
  private _notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this._notifications.asObservable();

  private _unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this._unreadCount.asObservable();

  private currentPage = 1;
  private totalPages = 1;
  private isInitialized = false;
  private isLoading = false;

  // [NEW] Cấu hình âm thanh
  public isSoundEnabled = true;

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
  ) {
    // [NEW] Khởi tạo setting từ localStorage
    this.initSoundSetting();
    this.initSocket();
  }

  // --- LOGIC SETTINGS ---
  private initSoundSetting() {
    const stored = localStorage.getItem('notification_sound_enabled');
    this.isSoundEnabled = stored !== null ? JSON.parse(stored) : true;
  }

  toggleSound(enabled: boolean) {
    this.isSoundEnabled = enabled;
    localStorage.setItem('notification_sound_enabled', JSON.stringify(enabled));
  }

  // --- LOGIC KHỞI TẠO ---
  init() {
    if (!this.isInitialized) {
      this.fetchNotifications(1);
      this.fetchUnreadCount();
      this.isInitialized = true;
    }
  }

  refresh() {
    this.currentPage = 1;
    this.fetchNotifications(1);
    this.fetchUnreadCount();
  }

  // --- API CALLS ---
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
          this._notifications.next(res.results);
        } else {
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
    if (!item.isRead) {
      item.isRead = true;
      const currentCount = this._unreadCount.value;
      this._unreadCount.next(Math.max(0, currentCount - 1));

      this.http.patch(`${this.baseUrl}/${item.id}/read`, {}).subscribe({
        error: () => {
          item.isRead = false;
          this._unreadCount.next(currentCount);
        },
      });
    }
  }

  markAllAsRead() {
    const currentList = this._notifications.value;
    currentList.forEach((n) => (n.isRead = true));
    this._notifications.next([...currentList]);
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

    const current = this._notifications.value;
    this._notifications.next([newNotif, ...current]);
    this._unreadCount.next(this._unreadCount.value + 1);

    // [UPDATED] Check setting trước khi phát
    this.playNotificationSound();
  }

  private playNotificationSound() {
    if (!this.isSoundEnabled) return;

    // Đường dẫn file trong assets
    const audio = new Audio('/sounds/notification.mp3');
    audio.load(); // Preload để tránh delay
    audio.play().catch((err) => console.error('Audio play error:', err));
  }

  get hasMorePages(): boolean {
    return this.currentPage < this.totalPages;
  }

  get isLoadingData(): boolean {
    return this.isLoading;
  }
}
