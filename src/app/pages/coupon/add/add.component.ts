import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CouponAddComponent } from '../../../shared/components/ecommerce/coupon/coupon-add/coupon-add.component';

@Component({
  selector: 'app-add-[coupon]',
  imports: [PageBreadcrumbComponent, CouponAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddCouponPageComponent {}
