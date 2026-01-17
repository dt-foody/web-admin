import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthService } from './api/auth.service'; // Giả sử bạn có AuthService để lấy token

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket | undefined;

  constructor(private authService: AuthService) {}

  // Khởi tạo kết nối
  connect() {
    console.log('Connecting to socket...', environment.socketUrl);
    const token = localStorage.getItem('access_token'); // Hoặc lấy từ AuthService

    if (!token || this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
      auth: {
        token: token, // Gửi token để Backend xác thực
      },
      transports: ['websocket'], // Ưu tiên websocket
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  // Lắng nghe sự kiện cụ thể
  on(eventName: string): Observable<any> {
    return new Observable((observer) => {
      this.socket?.on(eventName, (data) => {
        observer.next(data);
      });
    });
  }
}
