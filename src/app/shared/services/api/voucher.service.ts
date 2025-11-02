import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Voucher } from '../../models/voucher.model';
import { BaseService } from './_base.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VoucherService extends BaseService<Voucher> {
  constructor(http: HttpClient) {
    super(http, 'vouchers');
  }
}
