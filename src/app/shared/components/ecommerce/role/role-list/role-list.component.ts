import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Role } from '../../../../models/role.model';
import { RoleService } from '../../../../services/api/role.service';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-role-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
  ],
  templateUrl: './role-list.component.html',
  styles: ``,
})
export class RoleListComponent extends BaseListComponent<Role> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;

  itemToDelete: Role | null = null;

  constructor(
    private roleService: RoleService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('RoleListComponent init logic');
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'permissions',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    if (this.query && this.query.search && this.query.search.trim()) {
      params.name = this.query.search.trim();
    }

    this.roleService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  getPermissionsCount(role: Role): number {
    return role.permissions?.length || 0;
  }

  handleEdit(role: Role): void {
    this.router.navigate(['/role/edit', role.id]);
  }

  handleDelete(role: Role): void {
    this.itemToDelete = role;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.roleService.delete(this.itemToDelete.id).subscribe({
          next: () => {
            this.toastr.success('Delete successfully!', 'Role');
            this.fetchData();
          },
          error: (err) => {
            this.toastr.error('Failed to delete role', 'Role');
          },
        });
      }
      this.itemToDelete = null;
    });
  }

  handleViewPermissions(role: Role): void {
    // this.router.navigate(['/role/permissions', role.id]);
  }
}
