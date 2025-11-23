import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { User } from '../../../../models/user.model';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { UserService } from '../../../../services/api/user.service';
import { DialogService } from '@ngneat/dialog';
import { BaseListComponent } from '../../../../core/base-list.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../ui/button/button.component';
import { CheckboxComponent } from '../../../form/input/checkbox.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgSelectModule,
    FormsModule,
    SearchInputComponent,
    PaginationComponent,
    SortHeaderComponent,
    ButtonComponent,
    CheckboxComponent,
    HasPermissionDirective,
  ],
  templateUrl: './user-list.component.html',
})
export class UserListComponent extends BaseListComponent<User> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('confirmDeleteMany') confirmDeleteManyTpl!: TemplateRef<any>;
  itemToDelete: User | null = null;

  roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'user', label: 'User' },
  ];

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private userService: UserService,
    private dialog: DialogService,
  ) {
    super();
  }

  override ngOnInit(): void {
    // ✅ Gọi lại base init
    super.ngOnInit();
  }

  override fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
    };

    if (this.query.search) {
      params.search = this.query.search;
    }

    if (this.query.sort) {
      params.sortBy = `${this.query.sort.key}:${this.query.sort.asc ? 'asc' : 'desc'}`;
    }

    if (this.query.role) {
      params.role = this.query.role;
    }

    if (this.query.isEmailVerified !== undefined) {
      params.isEmailVerified = this.query.isEmailVerified;
    }

    // Replace with actual service call
    this.userService.getAll(params).subscribe({
      next: (response) => {
        this.dataSources = response.results || [];
        this.totalPages = response.totalPages || 0;
        this.totalResults = response.totalResults || 0;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.toastr.error('Failed to load users', 'Error');
      },
    });
  }

  onFilterChange() {
    this.query.page = 1;
    this.fetchData();
  }

  handleEdit(user: User) {
    this.router.navigate(['/user/edit', user.id]);
  }

  handleDelete(user: User): void {
    this.itemToDelete = user;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.userService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Delete successfully!', 'User');
          this.fetchData();
        });
      }
      this.itemToDelete = null;
    });
  }

  handleDeleteMany() {
    if (this.selected.length === 0) {
      this.toastr.warning('Please select users to delete', 'Warning');
      return;
    }

    const dialogRef = this.dialog.open(this.confirmDeleteManyTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.userService.deleteMany(this.selected).subscribe({
          next: () => {
            this.toastr.success('Delete successfully!', 'User');
            this.fetchData();
            this.selected = [];
          },
          error: (err) => {
            this.toastr.error('Failed to delete users', 'User');
          },
        });
      }
    });
  }

  handleToggleVerification(user: User) {
    const newStatus = !user.isEmailVerified;

    // Replace with actual service call
    this.userService.update(user.id, { isEmailVerified: newStatus }).subscribe({
      next: () => {
        user.isEmailVerified = newStatus;
        this.toastr.success(
          `User ${newStatus ? 'verified' : 'unverified'} successfully`,
          'Success',
        );
      },
      error: (err) => {
        console.error('Error updating verification status:', err);
        this.toastr.error('Failed to update verification status', 'Error');
      },
    });
  }

  getRoleBadgeClass(role: string): string {
    const classes: Record<string, string> = {
      admin: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400',
      user: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      guest: 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400',
    };
    return classes[role] || classes['guest'];
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      admin: 'Quản trị viên',
      staff: 'Nhân viên',
      customer: 'Khách hàng',
      guest: 'Khách vãng lai', // Hoặc dùng "Khách ghé thăm"
    };
    return labels[role] || role;
  }

  handleToggleActive(user: User): void {
    this.userService.update(user.id, { isActive: !user.isActive }).subscribe({
      next: () => {
        user.isActive = !user.isActive;
        this.toastr.success('Update successfully!', 'User');
      },
      error: () => {
        this.toastr.error('Update failed!', 'User');
      },
    });
  }
}
