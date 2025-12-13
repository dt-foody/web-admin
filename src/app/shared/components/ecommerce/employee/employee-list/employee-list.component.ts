import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Employee } from '../../../../models/employee.model';
import { EmployeeService } from '../../../../services/api/employee.service';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { CheckboxComponent } from '../../../form/input/checkbox.component';

@Component({
  selector: 'app-employee-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    CheckboxComponent,
    HasPermissionDirective,
  ],
  templateUrl: './employee-list.component.html',
  styles: ``,
})
export class EmployeeListComponent extends BaseListComponent<Employee> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;

  itemToDelete: Employee | null = null;

  @ViewChild('confirmDeleteMany') confirmDeleteManyTpl!: TemplateRef<any>;

  constructor(
    private employeeService: EmployeeService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('EmployeeListComponent init logic');
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    this.employeeService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  getGenderLabel(gender?: string): string {
    const labels: Record<string, string> = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác',
    };
    return gender ? labels[gender] || '-' : '-';
  }

  getGenderBadgeClass(gender?: string): string {
    const classes: any = {
      male: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      female: 'bg-pink-50 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400',
      other: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400',
    };
    return gender
      ? classes[gender] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400'
      : 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getDefaultAddress(employee: Employee): string {
    const defaultAddr = employee.addresses?.find((addr) => addr.isDefault);
    if (defaultAddr) {
      return `${defaultAddr.street}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.city}`;
    }
    return employee.addresses && employee.addresses.length > 0
      ? `${employee.addresses[0].street}, ${employee.addresses[0].ward}, ${employee.addresses[0].district}, ${employee.addresses[0].city}`
      : '-';
  }

  getAddressCount(employee: Employee): number {
    return employee.addresses?.length || 0;
  }

  handleEdit(employee: Employee): void {
    this.router.navigate(['/employee/edit', employee.id]);
  }

  handleDelete(employee: Employee): void {
    this.itemToDelete = employee;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.employeeService.delete(this.itemToDelete.id).subscribe({
          next: () => {
            this.toastr.success('Delete successfully!', 'Employee');
            this.fetchData();
          },
          error: (err) => {
            this.toastr.error(err?.error?.message || 'Delete failed!', 'Employee');
          },
        });
      }
      this.itemToDelete = null;
    });
  }

  handleViewDetail(employee: Employee): void {
    // You can implement view detail modal or navigate to detail page
    this.router.navigate(['/employee/detail', employee.id]);
  }

  handleDeleteMany() {
    if (this.selected.length === 0) return;

    // Mở dialog xác nhận
    const dialogRef = this.dialog.open(this.confirmDeleteManyTpl, {
      data: { count: this.selected.length }, // Truyền số lượng
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Gọi service deleteMany
        this.employeeService.deleteMany(this.selected).subscribe({
          next: () => {
            this.toastr.success(
              `Đã xóa thành công ${this.selected.length} nhân viên!`,
              'Thành công',
            );
            this.selected = []; // Reset danh sách chọn
            this.fetchData(); // Tải lại dữ liệu bảng
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Có lỗi xảy ra khi xóa nhân viên.', 'Lỗi');
          },
        });
      }
    });
  }
}
