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
  title = 'Foody Order Admin';
  authService = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    // Chỉ gọi getMe nếu cần, bắt lỗi để không block app
    this.authService.getMe().subscribe({
      next: (user) => {
        console.log('User info:', user);
      },
      error: (err) => {
        console.warn('Chưa login, redirect sang login');
      },
    });
  }
}
