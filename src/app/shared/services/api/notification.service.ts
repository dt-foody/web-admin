import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  // ... các field khác
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  // Lấy danh sách thông báo
  getNotifications(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', 'createdAt:desc');

    return this.http.get<any>(this.baseUrl, { params });
  }

  // Lấy số lượng chưa đọc
  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.baseUrl}/unread-count`);
  }

  // Đánh dấu 1 cái đã đọc
  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${notificationId}/read`, {});
  }

  // Đánh dấu tất cả đã đọc
  markAllAsRead(): Observable<any> {
    return this.http.patch(`${this.baseUrl}/read-all`, {});
  }
}
