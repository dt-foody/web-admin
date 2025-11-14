import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogPostDetailComponent } from '../../../shared/components/ecommerce/blog-post/blog-post-detail/blog-post-detail.component';

@Component({
  selector: 'app-detail-[blog-post]',
  imports: [PageBreadcrumbComponent, BlogPostDetailComponent],
  templateUrl: './detail.component.html',
  styles: ``,
})
export class DetailBlogPostPageComponent {}
