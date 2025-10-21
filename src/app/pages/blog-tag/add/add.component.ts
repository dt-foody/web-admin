import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BlogTagAddComponent } from '../../../shared/components/ecommerce/blog-tag/blog-tag-add/blog-tag-add.component';

@Component({
  selector: 'app-add-[blog-tag]',
  imports: [PageBreadcrumbComponent, BlogTagAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddBlogTagPageComponent {}
