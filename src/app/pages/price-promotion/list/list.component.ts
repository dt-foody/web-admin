import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { PricePromotionListComponent } from '../../../shared/components/ecommerce/price-promotion/price-promotion-list/price-promotion-list.component';

@Component({
  selector: 'app-[price-promotions]',
  imports: [PageBreadcrumbComponent, PricePromotionListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class PricePromotionListPageComponent {}
