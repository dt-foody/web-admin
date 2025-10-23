// src/app/core/services/api/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Router } from '@angular/router';

// Định nghĩa cấu trúc trả về của API để code chặt chẽ hơn
export interface AuthResponse {
  user: {
    role: string;
    isEmailVerified: boolean;
    name: string;
    email: string;
    id: string;
  };
  tokens: {
    access: {
      token: string;
      expires: string;
    };
    refresh: {
      token: string;
      expires: string;
    };
  };
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // --- Properties ---
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  private readonly PERMISSION_KEY = 'permissions';

  // Quản lý request refresh token đang chạy để tránh race condition
  private refreshTokenRequest$: Observable<AuthResponse> | null = null;

  // Cung cấp trạng thái user real-time cho toàn bộ ứng dụng
  private userSubject = new BehaviorSubject<any | null>(this.getUser());
  public user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // --- Các phương thức chính ---

  /**
   * Đăng nhập và lưu trữ thông tin
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password }).pipe(
      tap((res) => this.handleAuthSuccess(res))
    );
  }

  /**
   * Đăng xuất, xóa toàn bộ thông tin lưu trữ
   */
  logout(): void {
    // Optional: Gửi request tới server để vô hiệu hóa refresh token nếu có API
    // const refreshToken = this.getRefreshToken();
    // if (refreshToken) {
    //   this.http.post(`${this.API_URL}/auth/logout`, { refreshToken }).subscribe();
    // }

    localStorage.clear();
    this.refreshTokenRequest$ = null;
    this.userSubject.next(null); // Thông báo cho toàn bộ app là user đã logout
    this.router.navigateByUrl('/signin');
  }

  /**
   * Xử lý làm mới token.
   * Đây là phương thức "then chốt", đảm bảo chỉ có 1 request được gửi đi.
   */
  refreshToken(): Observable<AuthResponse> {
    // Nếu đã có một request refresh đang chạy, trả về chính nó
    if (this.refreshTokenRequest$) {
      return this.refreshTokenRequest$;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No refresh token available. Logging out.'));
    }

    // Bắt đầu một request refresh mới
    this.refreshTokenRequest$ = this.http
      .post<AuthResponse>(`${this.API_URL}/auth/refresh-tokens`, { refreshToken })
      .pipe(
        tap((res: AuthResponse) => {
          this.handleAuthSuccess(res);
        }),
        catchError((error) => {
          this.logout(); // Nếu refresh thất bại, đăng xuất người dùng
          return throwError(() => error);
        }),
        // shareReplay(1) là chìa khóa:
        // - Đảm bảo API chỉ được gọi MỘT LẦN.
        // - Tất cả các subscriber đến sau sẽ nhận được kết quả của lần gọi đó.
        shareReplay(1),
        // Dọn dẹp refreshTokenRequest$ sau khi observable hoàn tất để lần sau có thể refresh tiếp
        tap(() => {
          this.refreshTokenRequest$ = null;
        })
      );

    return this.refreshTokenRequest$;
  }

  // --- Các phương thức phụ trợ ---

  /**
   * Xử lý lưu thông tin sau khi đăng nhập hoặc refresh thành công
   */
  private handleAuthSuccess(res: AuthResponse): void {
    if (res.tokens?.access?.token) {
      this.setToken(res.tokens.access.token);
    }
    if (res.tokens?.refresh?.token) {
      this.setRefreshToken(res.tokens.refresh.token);
    }
    if (res.user) {
      this.setUser(res.user);
      this.userSubject.next(res.user); // Cập nhật trạng thái user cho toàn ứng dụng
    }
    if (res.permissions) {
      this.setPermissions(res.permissions);
    }
  }

  /**
   * Lấy access token từ localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  private setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_KEY, token);
  }

  getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      // Nếu dữ liệu trong localStorage bị lỗi, xóa nó đi
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  private setUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private setPermissions(permissions: string[]): void {
    localStorage.setItem(this.PERMISSION_KEY, JSON.stringify(permissions));
  }

  getPermissions(): string[] {
    const permissions = localStorage.getItem(this.PERMISSION_KEY);
    return permissions ? JSON.parse(permissions) : [];
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/auth/me`).pipe(
      tap((res) => {
        if (res) {
          this.setUser(res);
        }
        if (res.permissions) {
          this.setPermissions(res.permissions);
        }
      }),
    );
  }
}