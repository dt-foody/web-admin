import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserListComponent } from '../../../shared/components/ecommerce/user/user-list/user-list.component';

@Component({
  selector: 'app-[user]',
  imports: [PageBreadcrumbComponent, UserListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class UserListPageComponent {}
