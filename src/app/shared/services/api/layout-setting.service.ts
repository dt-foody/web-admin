import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './_base.service';
import { LayoutSetting } from '../../models/layout-setting.model';

@Injectable({
  providedIn: 'root',
})
export class LayoutSettingService extends BaseService<LayoutSetting> {
  constructor(http: HttpClient) {
    // 'layout-settings' là endpoint API, API call sẽ là: /v1/layout-settings
    super(http, 'layout-settings');
  }
}
