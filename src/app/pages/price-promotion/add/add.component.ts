import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PricePromotionAddComponent } from '../../../shared/components/ecommerce/price-promotion/price-promotion-add/price-promotion-add.component';

@Component({
  selector: 'app-add-[price-promotion]',
  imports: [PageBreadcrumbComponent, PricePromotionAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddPricePromotionPageComponent {}
