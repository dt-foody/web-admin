import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from './auth.service';

export abstract class BaseService<T> {
  protected readonly apiUrl: string;

  constructor(
    protected http: HttpClient,
    protected model: string,
    protected authService?: AuthService,
  ) {
    this.apiUrl = `${environment.apiUrl}/${model}`;
  }

  // 🔹 Get all records
  getAll(query: any = {}): Observable<{
    results: T[];
    page: number;
    limit: number;
    totalPages: number;
    totalResults: number;
  }> {
    let params = new HttpParams();

    // ✅ Convert object query thành query params
    Object.keys(query).forEach((key) => {
      const val = query[key];
      if (Array.isArray(val)) {
        params = params.append(key, val.join(','));
      } else if (val !== undefined && val !== null) {
        params = params.append(key, val);
      }
    });

    // ✅ Trả về object dạng pagination (đúng với API bạn cung cấp)
    return this.http
      .get<{
        results: T[];
        page: number;
        limit: number;
        totalPages: number;
        totalResults: number;
      }>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  // 🔹 Get by ID
  getById(id: string | number, query: any = {}): Observable<T> {
    let params = new HttpParams();

    // ✅ Convert object query thành query params
    Object.keys(query).forEach((key) => {
      const val = query[key];
      if (Array.isArray(val)) {
        params = params.append(key, val.join(','));
      } else if (val !== undefined && val !== null) {
        params = params.append(key, val);
      }
    });

    return this.http.get<T>(`${this.apiUrl}/${id}`, { params }).pipe(catchError(this.handleError));
  }

  // 🔹 Create
  create(item: Partial<T>): Observable<T> {
    return this.http.post<T>(this.apiUrl, item).pipe(catchError(this.handleError));
  }

  // 🔹 Update (PATCH mặc định, PUT nếu cần)
  update(id: string | number, item: Partial<T>, usePut: boolean = false): Observable<T> {
    console.log('item', item);
    const req = usePut
      ? this.http.put<T>(`${this.apiUrl}/${id}`, item)
      : this.http.patch<T>(`${this.apiUrl}/${id}`, item);

    return req.pipe(catchError(this.handleError));
  }

  // 🔹 Delete
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
  }

  // 🔹 Delete nhiều record
  deleteMany(ids: string[]): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/ids/${ids.join(',')}`)
      .pipe(catchError(this.handleError));
  }

  // 🔹 Xử lý lỗi chung
  protected handleError(error: HttpErrorResponse) {
    const message = error.error?.message || error.message || 'Unknown server error';

    console.error('❌ API ERROR:', {
      url: error.url,
      status: error.status,
      message,
      details: error.error,
    });

    return throwError(() => ({
      status: error.status,
      message,
      details: error.error,
    }));
  }
}
