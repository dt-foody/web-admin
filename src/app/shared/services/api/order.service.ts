import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../../models/order.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService extends BaseService<Order> {
  constructor(http: HttpClient) {
    super(http, 'orders');
  }
}
