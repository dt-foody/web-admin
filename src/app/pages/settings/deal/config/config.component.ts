import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { DealSettingComponent } from '../../../../shared/components/settings/deal/deal-setting/deal-setting.component';

@Component({
  selector: 'app-deal-setting-page',
  standalone: true,
  imports: [PageBreadcrumbComponent, DealSettingComponent],
  template: `
    <div>
      <app-page-breadcrumb
        pageTitle="Cấu hình Đơn hàng"
        [breadcrumbItems]="[
          { label: 'Thiết lập', url: '/' },
          { label: 'Đơn hàng', url: '/settings/deal' },
        ]"
      >
      </app-page-breadcrumb>
      <app-deal-setting></app-deal-setting>
    </div>
  `,
})
export class DealSettingPageComponent {}
