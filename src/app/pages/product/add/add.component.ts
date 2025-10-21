import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ProductAddComponent } from '../../../shared/components/ecommerce/product/product-add/product-add.component';

@Component({
  selector: 'app-add-[product]',
  imports: [PageBreadcrumbComponent, ProductAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddProductPageComponent {}
