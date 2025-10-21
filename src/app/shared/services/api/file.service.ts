import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private apiUrl = `${environment.apiUrl}/files`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // 🔹 Tự động gắn token (nếu có)
  protected getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || this.authService?.getToken?.() || '';

    console.log('token', token);
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  uploadFile(file: File): Observable<{ message: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    console.log('uploadFile');

    return this.http.post<{ message: string; url: string }>(`${this.apiUrl}/upload`, formData, {
      headers: this.getHeaders(),
    });
  }
}
