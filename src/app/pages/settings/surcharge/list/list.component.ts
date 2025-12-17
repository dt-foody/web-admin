import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { SurchargeListComponent } from '../../../../shared/components/settings/surcharge/surcharge-list/surcharge-list.component';

@Component({
  selector: 'app-surcharge-list-page',
  standalone: true,
  imports: [PageBreadcrumbComponent, SurchargeListComponent],
  templateUrl: './list.component.html',
})
export class SurchargeListPageComponent {}
