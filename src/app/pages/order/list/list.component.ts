import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { OrderListComponent } from '../../../shared/components/ecommerce/order/order-list/order-list.component';

@Component({
  selector: 'app-list-order',
  imports: [PageBreadcrumbComponent, OrderListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class OrderListPageComponent {}
