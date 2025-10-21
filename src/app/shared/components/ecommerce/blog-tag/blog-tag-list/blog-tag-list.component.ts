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
import { BlogTag } from '../../../../models/blog-tag.model';
import { BlogTagService } from '../../../../services/api/blog-tag.service';

@Component({
  selector: 'app-blog-tag-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
  ],
  templateUrl: './blog-tag-list.component.html',
})
export class BlogTagListComponent extends BaseListComponent<BlogTag> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;

  itemToDelete: BlogTag | null = null;

  constructor(
    private blogTagService: BlogTagService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    // Call base init which sets up query params from URL
    super.ngOnInit();
  }

  fetchData() {
    // Build query params for the API request
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      // Sort key format is "key:direction", e.g., "name:asc"
      sortBy: this.query.sort
        ? `${this.query.sort.key}:${this.query.sort.asc ? 'asc' : 'desc'}`
        : undefined,
    };

    // Add search term if it exists
    if (this.query.search?.trim()) {
      params.search = this.query.search.trim();
    }

    // Call the service to get data
    this.blogTagService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  handleEdit(tag: BlogTag): void {
    this.router.navigate(['/blog-tag/edit', tag.id]);
  }

  handleDelete(tag: BlogTag): void {
    this.itemToDelete = tag;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl);

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.blogTagService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Tag deleted successfully!', 'Success');
          this.fetchData(); // Refresh the list
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(tag: BlogTag): void {
    this.blogTagService.update(tag.id, { isActive: !tag.isActive }).subscribe({
      next: () => {
        // Update the local data to reflect the change immediately
        tag.isActive = !tag.isActive;
        this.toastr.success('Tag status updated successfully!', 'Success');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Failed to update tag status.', 'Error');
      },
    });
  }
}
