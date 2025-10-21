import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

/** Khi có token mới, gọi lại tất cả request đã chờ */
function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

/** Khi đang refresh, thêm request vào hàng đợi */
function subscribeTokenRefresh(cb: () => void) {
  refreshSubscribers.push(cb);
}

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // 🔹 Đính kèm access token nếu có
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // 🔹 Xử lý pipeline
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh-tokens')) {
        if (!isRefreshing) {
          isRefreshing = true;

          // 🔁 Refresh token
          return authService.refreshToken().pipe(
            switchMap(async () => {
              isRefreshing = false;
              onRefreshed();

              // ⚡ Gửi lại request cũ — token mới đã được lưu trong localStorage
              const result = await firstValueFrom(next(req.clone()));
              return result;
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              authService.logout();
              router.navigate(['/signin']);
              return throwError(() => refreshError);
            }),
          );
        } else {
          // ⏳ Nếu đang refresh → chờ refresh xong rồi gửi lại
          return new Promise<HttpEvent<any>>((resolve) => {
            subscribeTokenRefresh(async () => {
              const result = await firstValueFrom(next(req.clone()));
              resolve(result);
            });
          });
        }
      }

      // 🚫 Nếu lỗi 403 → redirect forbidden
      if (error.status === 403) {
        router.navigate(['/forbidden']);
      }

      return throwError(() => error);
    }),
  );
};
