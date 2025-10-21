import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogCategoryAddComponent } from '../../../shared/components/ecommerce/blog-category/blog-category-add/blog-category-add.component';

@Component({
  selector: 'app-add-[blog-category]',
  imports: [PageBreadcrumbComponent, BlogCategoryAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddBlogCategoryPageComponent {}
