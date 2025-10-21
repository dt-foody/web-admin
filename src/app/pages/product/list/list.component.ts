import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ProductListComponent } from '../../../shared/components/ecommerce/product/product-list/product-list.component';

@Component({
  selector: 'app-[products]',
  imports: [PageBreadcrumbComponent, ProductListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class ProductListPageComponent {}
