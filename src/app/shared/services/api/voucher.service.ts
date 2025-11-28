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

  /**
   * Thu hồi voucher
   * Backend: PATCH /vouchers/:id { status: 'REVOKED', revokeAt: now }
   */
  revoke(id: string): Observable<Voucher> {
    // Sử dụng hàm update của BaseService để đổi status
    return this.update(id, { status: 'REVOKED', revokeAt: new Date() } as any);
  }
}
