import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CouponListComponent } from '../../../shared/components/ecommerce/coupon/coupon-list/coupon-list.component';

@Component({
  selector: 'app-[coupons]',
  imports: [PageBreadcrumbComponent, CouponListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class CouponListPageComponent {}
