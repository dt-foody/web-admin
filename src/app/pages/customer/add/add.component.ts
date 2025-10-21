import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CustomerAddComponent } from '../../../shared/components/ecommerce/customer/customer-add/customer-add.component';

@Component({
  selector: 'app-add-[customer]',
  imports: [PageBreadcrumbComponent, CustomerAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddCustomerPageComponent {}
