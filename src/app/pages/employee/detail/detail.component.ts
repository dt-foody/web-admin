import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { EmployeeDetailComponent } from '../../../shared/components/ecommerce/employee/employee-detail/employee-detail.component';

@Component({
  selector: 'app-detail-[employee]',
  imports: [PageBreadcrumbComponent, EmployeeDetailComponent],
  templateUrl: './detail.component.html',
  styles: ``,
})
export class DetailEmployeePageComponent {}
