import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserAddComponent } from '../../../shared/components/ecommerce/user/user-add/user-add.component';

@Component({
  selector: 'app-add-[user]',
  imports: [PageBreadcrumbComponent, UserAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddUserPageComponent {}
