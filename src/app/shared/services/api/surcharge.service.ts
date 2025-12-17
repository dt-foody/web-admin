import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './_base.service';
import { Surcharge } from '../../models/surcharge.model';

@Injectable({
  providedIn: 'root',
})
export class SurchargeService extends BaseService<Surcharge> {
  constructor(http: HttpClient) {
    // Giả sử endpoint API là 'surcharges'
    super(http, 'surcharges');
  }
}
