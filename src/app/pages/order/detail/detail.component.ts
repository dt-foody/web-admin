import { Component } from '@angular/core';
import { OrderDetailComponent } from '../../../shared/components/ecommerce/order/order-detail/order-detail.component';

@Component({
  selector: 'app-detail-[order]',
  imports: [OrderDetailComponent],
  templateUrl: './detail.component.html',
  styles: ``,
})
export class DetailOrderPageComponent {}
