import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { EmployeeListComponent } from '../../../shared/components/ecommerce/employee/employee-list/employee-list.component';

@Component({
  selector: 'app-list-employee',
  imports: [PageBreadcrumbComponent, EmployeeListComponent],
  templateUrl: './list.component.html',
  styles: ``,
})
export class EmployeeListPageComponent {}
