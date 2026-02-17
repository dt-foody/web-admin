import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ShippingSettingComponent } from '../../../../shared/components/settings/shipping/shipping-setting/shipping-setting.component';

@Component({
  selector: 'app-shipping-config',
  standalone: true,
  imports: [CommonModule, PageBreadcrumbComponent, ShippingSettingComponent],
  template: `
    <div class="space-y-6">
      <app-page-breadcrumb
        pageTitle="Cấu hình Phí Ship Đồng Giá"
        [breadcrumbItems]="[
          { label: 'Thiết lập', url: '/' },
          { label: 'Vận chuyển', url: '/settings/shipping' },
        ]"
      ></app-page-breadcrumb>

      <app-shipping-setting></app-shipping-setting>
    </div>
  `,
})
export class ConfigComponent {}
