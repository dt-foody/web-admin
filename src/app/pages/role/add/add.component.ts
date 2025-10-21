import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { RoleAddComponent } from '../../../shared/components/ecommerce/role/role-add/role-add.component';

@Component({
  selector: 'app-add-[role]',
  imports: [PageBreadcrumbComponent, RoleAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddRolePageComponent {}
