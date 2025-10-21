import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CategoryListComponent } from '../../../shared/components/ecommerce/category/category-list/category-list.component';

@Component({
  selector: 'app-[category]',
  imports: [PageBreadcrumbComponent, CategoryListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class CategoryListPageComponent {}
