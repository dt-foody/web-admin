import { Injectable } from '@angular/core';
import { BaseService } from './_base.service'; // Giả định bạn có base service
import { DealSetting } from '../../models/deal-setting.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DealSettingService extends BaseService<DealSetting> {
  constructor(http: HttpClient) {
    super(http, 'deal-settings');
  }
}
