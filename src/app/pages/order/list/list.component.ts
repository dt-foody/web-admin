import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { OrderListComponent } from '../../../shared/components/ecommerce/order/order-edit/order-list.component';

@Component({
  selector: 'app-[order]',
  imports: [PageBreadcrumbComponent, OrderListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class OrderListPageComponent {}
