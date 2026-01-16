import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LayoutSettingComponent } from '../../../../shared/components/settings/layout/layout-setting/layout-setting.component';

@Component({
  selector: 'app-layout-setting-page',
  standalone: true,
  imports: [PageBreadcrumbComponent, LayoutSettingComponent],
  template: `
    <div>
      <app-page-breadcrumb
        pageTitle="Cấu hình Giao diện"
        [breadcrumbItems]="[
          { label: 'Thiết lập', url: '/' },
          { label: 'Giao diện', url: '/settings/layout' },
        ]"
      >
      </app-page-breadcrumb>
      <app-layout-setting></app-layout-setting>
    </div>
  `,
})
export class LayoutSettingPageComponent {}
