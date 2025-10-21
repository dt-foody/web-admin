import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CustomerDetailComponent } from '../../../shared/components/ecommerce/customer/customer-detail/customer-detail.component';

@Component({
  selector: 'app-detail-[customer]',
  imports: [PageBreadcrumbComponent, CustomerDetailComponent],
  templateUrl: './detail.component.html',
  styles: ``,
})
export class DetailCustomerPageComponent {}
