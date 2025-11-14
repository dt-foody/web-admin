import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CustomerListComponent } from '../../../shared/components/ecommerce/customer/customer-list/customer-list.component';

@Component({
  selector: 'app-list-customer',
  imports: [PageBreadcrumbComponent, CustomerListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class CustomerListPageComponent {}
