import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Coupon } from '../../models/coupon.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class CouponService extends BaseService<Coupon> {
  constructor(http: HttpClient) {
    super(http, 'coupons');
  }
}
