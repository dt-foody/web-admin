import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { OrderDetailComponent } from '../../../shared/components/ecommerce/order/order-detail/order-detail.component';

@Component({
  selector: 'app-detail-[order]',
  imports: [PageBreadcrumbComponent, OrderDetailComponent],
  templateUrl: './detail.component.html',
  styles: ``,
})
export class DetailOrderPageComponent {}
