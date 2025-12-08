import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from './shared/services/api/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Lưu Chi - Cà phê chi rứa?';
  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    // Gọi API lấy thông tin user
    this.authService.getMe().subscribe({
      next: (data) => {
        console.log('User info:', data);
        // Kiểm tra role của user trong dữ liệu trả về
        if (data?.user?.role === 'customer') {
          // Nếu là customer, chuyển hướng đến trang 403 (forbidden)
          this.router.navigate(['/forbidden']);
        }
      },
      error: (err) => {
        console.warn('Chưa login, redirect sang login');
      },
    });
  }
}
