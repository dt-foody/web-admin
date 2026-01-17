import { Component, inject, OnInit, OnDestroy } from '@angular/core'; // Import thêm OnDestroy
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './shared/services/api/auth.service';
import { SocketService } from './shared/services/socket.service'; // 1. Import SocketService

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Lưu Chi - Cà phê chi rứa?';

  // Dependency Injection
  authService = inject(AuthService);
  router = inject(Router);
  socketService = inject(SocketService); // 2. Inject SocketService

  ngOnInit() {
    // Gọi API lấy thông tin user
    this.authService.getMe().subscribe({
      next: (data) => {
        console.log('User info:', data);

        // Kiểm tra role
        if (data?.user?.role === 'customer') {
          this.router.navigate(['/forbidden']);
          return; // Dừng logic ở đây nếu là customer
        }

        // 3. KẾT NỐI SOCKET
        // Chỉ kết nối khi user đã đăng nhập thành công và có quyền truy cập
        this.socketService.connect();
      },
      error: (err) => {
        console.warn('Chưa login, redirect sang login');
        // Không connect socket ở đây vì chưa có token hợp lệ
      },
    });
  }

  // 4. Ngắt kết nối khi component bị hủy (ví dụ tắt tab hoặc reload)
  ngOnDestroy() {
    this.socketService.disconnect();
  }
}
