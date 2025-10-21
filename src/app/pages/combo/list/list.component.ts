import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComboListComponent } from '../../../shared/components/ecommerce/combo/combo-list/combo-list.component';

@Component({
  selector: 'app-[combo]',
  imports: [PageBreadcrumbComponent, ComboListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class ComboListPageComponent {}
