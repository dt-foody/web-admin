import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { OrderAddComponent } from '../../../shared/components/ecommerce/order/order-add/order-add.component';

@Component({
  selector: 'app-add-[order]',
  imports: [PageBreadcrumbComponent, OrderAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddOrderPageComponent {}
