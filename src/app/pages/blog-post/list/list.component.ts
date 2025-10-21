import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogPostListComponent } from '../../../shared/components/ecommerce/blog-post/blog-post-list/blog-post-list.component';

@Component({
  selector: 'app-[blog-posts]',
  imports: [PageBreadcrumbComponent, BlogPostListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class BlogPostListPageComponent {}
