import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
  permissions: [];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';
  private readonly PERMISSION_KEY = 'permissions';

  constructor(private http: HttpClient) {}

  /**
   * Đăng nhập
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password }).pipe(
      tap((res) => {
        if (res.tokens?.access?.token) {
          this.setToken(res.tokens.access.token);
        }
        if (res.tokens?.refresh?.token) {
          this.setRefreshToken(res.tokens.refresh.token);
        }
        if (res.user) {
          this.setUser(res.user);
        }
        if (res.permissions) {
          this.setPermissions(res.permissions);
        }
      }),
    );
  }

  /**
   * Lấy thông tin user
   */
  getUser(): any | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setUser(user: any) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  removeUser() {
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Đăng xuất
   */
  logout(): void {
    this.removeToken();
    this.removeRefreshToken();
    this.removeUser();
  }

  /**
   * Access token
   */
  private setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Refresh token
   */
  private setRefreshToken(token: string) {
    localStorage.setItem(this.REFRESH_KEY, token);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  removeRefreshToken() {
    localStorage.removeItem(this.REFRESH_KEY);
  }

  /**
   * Permission
   */
  private setPermissions(permissions: string[]) {
    localStorage.setItem(this.PERMISSION_KEY, JSON.stringify(permissions));
  }

  getPermissions(): string[] {
    const permissions = localStorage.getItem(this.PERMISSION_KEY);
    return permissions ? JSON.parse(permissions) : [];
  }

  removePermissions() {
    localStorage.removeItem(this.PERMISSION_KEY);
  }

  /**
   * Kiểm tra trạng thái đăng nhập
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<any>(`${environment.apiUrl}/auth/refresh-tokens`, { refreshToken }).pipe(
      tap((res) => {
        if (res.tokens?.access?.token) {
          this.setToken(res.tokens.access.token);
        }
        if (res.tokens?.refresh?.token) {
          this.setRefreshToken(res.tokens.refresh.token);
        }
      }),
      map((res) => res.access.token),
    );
  }

  /**
   * Ví dụ gọi API cần token kèm header
   */
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
