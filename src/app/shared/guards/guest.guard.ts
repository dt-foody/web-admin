// guest.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('guestGuard chạy'); // chắc chắn guard được gọi

  if (authService.isLoggedIn()) {
    console.log('data login');
    router.navigate(['/']); // đã login -> redirect về homepage
    return false;
  } else {
    console.log('data login 1');
    return true; // chưa login -> cho phép vào signin/signup
  }
};
