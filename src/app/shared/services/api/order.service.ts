import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Order } from '../../models/order.model';
import { BaseService } from './_base.service';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderService extends BaseService<Order> {
  constructor(http: HttpClient) {
    super(http, 'orders');
  }

  adminCreateOrder(body: any) {
    return this.http
      .post<Order>(`${this.apiUrl}/admin-order`, body)
      .pipe(catchError(this.handleError));
  }

  adminUpdateOrder(id: string, body: any) {
    return this.http
      .patch<any>(`${this.apiUrl}/admin-order/${id}`, body)
      .pipe(catchError(this.handleError));
  }
}
