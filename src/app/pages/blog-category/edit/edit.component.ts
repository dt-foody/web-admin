import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogCategoryAddComponent } from '../../../shared/components/ecommerce/blog-category/blog-category-add/blog-category-add.component';

@Component({
  selector: 'app-edit-[blog-category]',
  imports: [PageBreadcrumbComponent, BlogCategoryAddComponent],
  templateUrl: './edit.component.html',
  styles: ``,
})
export class EditBlogCategoryPageComponent {}
