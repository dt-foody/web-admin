import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogPostAddComponent } from '../../../shared/components/ecommerce/blog-post/blog-post-add/blog-post-add.component';

@Component({
  selector: 'app-edit-[blog-post]',
  imports: [PageBreadcrumbComponent, BlogPostAddComponent],
  templateUrl: './edit.component.html',
  styles: ``,
})
export class EditBlogPostPageComponent {}
