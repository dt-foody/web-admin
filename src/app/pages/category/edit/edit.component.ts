import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { CategoryAddComponent } from '../../../shared/components/ecommerce/category/category-add/category-add.component';

@Component({
  selector: 'app-edit-[category]',
  imports: [PageBreadcrumbComponent, CategoryAddComponent],
  templateUrl: './edit.component.html',
  styles: ``,
})
export class EditCategoryPageComponent {}
