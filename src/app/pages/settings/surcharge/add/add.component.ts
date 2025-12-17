import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { SurchargeAddComponent } from '../../../../shared/components/settings/surcharge/surcharge-add/surcharge-add.component';

@Component({
  selector: 'app-surcharge-add-page',
  standalone: true,
  imports: [PageBreadcrumbComponent, SurchargeAddComponent],
  template: `
    <div>
      <app-page-breadcrumb
        pageTitle="Thêm Phụ thu"
        [breadcrumbItems]="[
          { label: 'Thiết lập', url: '/' },
          { label: 'Phụ thu', url: '/settings/surcharge' },
          { label: 'Thêm mới', url: '' },
        ]"
      >
      </app-page-breadcrumb>
      <app-surcharge-add></app-surcharge-add>
    </div>
  `,
})
export class SurchargeAddPageComponent {}
