import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

// Core and shared components
import { BaseListComponent } from '../../../../core/base-list.component';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

// Models and Services
import { BlogCategory } from '../../../../models/blog-category.model';
import { BlogCategoryService } from '../../../../services/api/blog-category.service';
import { CheckboxComponent } from '../../../form/input/checkbox.component';

@Component({
  selector: 'app-blog-category-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
    CheckboxComponent,
  ],
  templateUrl: './blog-category-list.component.html',
})
export class BlogCategoryListComponent extends BaseListComponent<BlogCategory> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;

  itemToDelete: BlogCategory | null = null;

  constructor(
    private blogCategoryService: BlogCategoryService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      sortBy: this.query.sort
        ? `${this.query.sort.key}:${this.query.sort.asc ? 'asc' : 'desc'}`
        : undefined,
    };

    if (this.query.search?.trim()) {
      params.search = this.query.search.trim();
    }

    this.blogCategoryService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  handleEdit(category: BlogCategory): void {
    this.router.navigate(['/blog-category/edit', category.id]);
  }

  handleDelete(category: BlogCategory): void {
    this.itemToDelete = category;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl);

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.blogCategoryService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Category deleted successfully!', 'Success');
          this.fetchData();
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(category: BlogCategory): void {
    this.blogCategoryService.update(category.id, { isActive: !category.isActive }).subscribe({
      next: () => {
        category.isActive = !category.isActive;
        this.toastr.success('Category status updated successfully!', 'Success');
      },
      error: (err) => {
        this.toastr.error('Failed to update category status.', 'Error');
      },
    });
  }
}
