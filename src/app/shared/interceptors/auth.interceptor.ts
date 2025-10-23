// src/app/core/interceptors/auth.interceptor.ts

import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

/**
 * Hàm helper để thêm token vào header của request
 */
const addTokenHeader = (req: HttpRequest<any>, token: string): HttpRequest<any> => {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Hàm helper xử lý logic khi gặp lỗi 401
 */
const handle401Error = (req: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService) => {
  // Logic cực kỳ đơn giản: chỉ cần gọi service để refresh token
  // Service sẽ tự đảm bảo nó chỉ chạy một lần và các request khác sẽ nhận được kết quả
  return authService.refreshToken().pipe(
    switchMap(() => {
      // Khi refresh thành công, lấy token mới nhất và gọi lại request cũ
      const newToken = authService.getToken();
      if (newToken) {
        return next(addTokenHeader(req, newToken));
      }
      // Nếu không có token mới sau khi refresh, đó là một lỗi
      return throwError(() => new Error('Failed to get new token after refresh'));
    }),
    catchError((refreshError) => {
      // Nếu refreshToken() thất bại, service đã xử lý logout
      // Chỉ cần ném lỗi ra để request gốc cũng nhận được thông báo lỗi
      return throwError(() => refreshError);
    }),
  );
};

/**
 * Interceptor chính
 */
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // 1. Đính kèm access token vào header nếu có
  if (token) {
    req = addTokenHeader(req, token);
  }

  // 2. Gửi request đi và xử lý lỗi
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 3. Nếu là lỗi 401 và không phải là request refresh-token -> xử lý refresh
      if (error.status === 401 && !req.url.includes('/auth/refresh-tokens')) {
        return handle401Error(req, next, authService);
      }

      // 4. Xử lý các lỗi khác nếu cần (ví dụ: 403 Forbidden)
      if (error.status === 403) {
        router.navigate(['/forbidden']); // Hoặc trang không có quyền
      }

      // 5. Ném các lỗi khác ra ngoài
      return throwError(() => error);
    }),
  );
};
