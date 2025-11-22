import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { EmployeeAddComponent } from '../../../shared/components/ecommerce/employee/employee-add/employee-add.component';

@Component({
  selector: 'app-edit-[employee]',
  imports: [PageBreadcrumbComponent, EmployeeAddComponent],
  templateUrl: './edit.component.html',
  styles: ``,
})
export class EditEmployeePageComponent {}
