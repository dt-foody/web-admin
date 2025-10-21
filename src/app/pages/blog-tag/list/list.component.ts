import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogTagListComponent } from '../../../shared/components/ecommerce/blog-tag/blog-tag-list/blog-tag-list.component';

@Component({
  selector: 'app-[blog-tags]',
  imports: [PageBreadcrumbComponent, BlogTagListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class BlogTagListPageComponent {}
