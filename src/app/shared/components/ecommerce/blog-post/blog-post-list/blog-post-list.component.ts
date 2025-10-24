import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { BlogPost } from '../../../../models/blog-post.model';
import { BlogPostService } from '../../../../services/api/blog-post.service';
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
  selector: 'app-blog-post-list',
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
  templateUrl: './blog-post-list.component.html',
  styles: ``,
})
export class BlogPostListComponent extends BaseListComponent<BlogPost> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;

  itemToDelete: BlogPost | null = null;

  constructor(
    private blogPostService: BlogPostService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('BlogPostListComponent init logic');
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'createdBy;categories;tags',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    this.blogPostService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      draft: 'Draft',
      published: 'Published',
      archived: 'Archived',
    };
    return labels[status] || status;
  }

  getStatusBadgeClass(status: string): string {
    const classes: any = {
      draft: 'bg-yellow-50 dark:bg-yellow-500/15 text-yellow-700 dark:text-yellow-400',
      published: 'bg-green-50 dark:bg-green-500/15 text-green-700 dark:text-green-400',
      archived: 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400',
    };
    return classes[status] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getCategoriesText(categories?: string[]): string {
    if (!categories || categories.length === 0) return '-';
    return categories.length > 2
      ? `${categories.slice(0, 2).join(', ')} +${categories.length - 2}`
      : categories.join(', ');
  }

  getTagsText(tags?: string[]): string {
    if (!tags || tags.length === 0) return '-';
    return tags.length > 3 ? `${tags.slice(0, 3).join(', ')} +${tags.length - 3}` : tags.join(', ');
  }

  getTruncatedContent(content: string, maxLength: number = 100): string {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  handleEdit(post: BlogPost): void {
    this.router.navigate(['/blog-post/edit', post.id]);
  }

  handleDelete(post: BlogPost): void {
    this.itemToDelete = post;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.blogPostService.delete(this.itemToDelete.id).subscribe({
          next: () => {
            this.toastr.success('Delete successfully!', 'Blog Post');
            this.fetchData();
          },
          error: (err) => {
            this.toastr.error(err?.error?.message || 'Delete failed!', 'Blog Post');
          },
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleStatus(post: BlogPost): void {
    const newStatus = post.status === 'published' ? 'draft' : 'published';

    this.blogPostService.update(post.id, { status: newStatus }).subscribe({
      next: () => {
        post.status = newStatus;
        this.toastr.success('Status updated successfully!', 'Blog Post');
      },
      error: () => {
        this.toastr.error('Status update failed!', 'Blog Post');
      },
    });
  }

  handleToggleFeatured(post: BlogPost, event: Event): void {
    event.stopPropagation();

    this.blogPostService.update(post.id, { isFeatured: !post.isFeatured }).subscribe({
      next: () => {
        post.isFeatured = !post.isFeatured;
        this.toastr.success('Featured status updated!', 'Blog Post');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Blog Post');
      },
    });
  }

  handleTogglePinned(post: BlogPost, event: Event): void {
    event.stopPropagation();

    this.blogPostService.update(post.id, { isPinned: !post.isPinned }).subscribe({
      next: () => {
        post.isPinned = !post.isPinned;
        this.toastr.success('Pinned status updated!', 'Blog Post');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Blog Post');
      },
    });
  }

  handleViewDetail(post: BlogPost): void {
    this.router.navigate(['/blog-post/detail', post.id]);
  }

  handleViewPost(post: BlogPost, event: Event): void {
    event.stopPropagation();
    // Open in new tab - you might want to adjust the URL based on your frontend routing
    window.open(`/blog/${post.slug || post.id}`, '_blank');
  }
}
