import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogCategoryListComponent } from '../../../shared/components/ecommerce/blog-category/blog-category-list/blog-category-list.component';

@Component({
  selector: 'app-[blog-categorys]',
  imports: [PageBreadcrumbComponent, BlogCategoryListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class BlogCategoryListPageComponent {}
