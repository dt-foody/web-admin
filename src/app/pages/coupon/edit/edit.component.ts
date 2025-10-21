import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CouponAddComponent } from '../../../shared/components/ecommerce/coupon/coupon-add/coupon-add.component';

@Component({
  selector: 'app-edit-[coupon]',
  imports: [PageBreadcrumbComponent, CouponAddComponent],
  templateUrl: './edit.component.html',
  styles: ``,
})
export class EditCouponPageComponent {}
