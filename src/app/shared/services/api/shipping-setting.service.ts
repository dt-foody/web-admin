import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './_base.service';
import { ShippingSetting } from '../../models/shipping-setting.model';

@Injectable({
  providedIn: 'root',
})
export class ShippingSettingService extends BaseService<ShippingSetting> {
  constructor(http: HttpClient) {
    super(http, 'shipping-settings');
  }
}
