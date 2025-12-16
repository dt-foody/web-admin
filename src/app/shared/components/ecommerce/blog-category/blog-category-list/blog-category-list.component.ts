import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, signal } from '@angular/core'; // Thêm signal
import { Router, RouterModule } from '@angular/router';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';

// Core and shared components
import { BaseListComponent } from '../../../../core/base-list.component';

// [1] Import CDK Drag Drop
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { BlogCategory } from '../../../../models/blog-category.model';
import { BlogCategoryService } from '../../../../services/api/blog-category.service';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
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
    DragDropModule, // [2] Thêm Module vào imports
  ],
  templateUrl: './blog-category-list.component.html',
  // [3] Copy styles từ CategoryListComponent để xử lý animation khi kéo thả
  styles: `
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow:
        0 5px 5px -3px rgba(0, 0, 0, 0.2),
        0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12);
      background-color: white;
      display: table;
    }
    .cdk-drag-placeholder {
      opacity: 0;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drag-preview,
    .cdk-drag-placeholder {
      transition: none !important;
    }
    .cdk-drag {
      transition: none;
    }
    tr.transition {
      transition-property: background-color, color, border-color !important;
      transition-duration: 150ms;
    }
    .drag-handle {
      cursor: grab;
      color: #9ca3af;
    }
    .drag-handle:active {
      cursor: grabbing;
      color: #4b5563;
    }
  `,
})
export class BlogCategoryListComponent extends BaseListComponent<BlogCategory> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  itemToDelete: BlogCategory | null = null;
  @ViewChild('confirmDeleteMany') confirmDeleteManyTpl!: TemplateRef<any>;

  // [4] State cho chế độ Drag Drop
  isDragMode = signal<boolean>(false);
  isSavingOrder = false;

  constructor(
    private blogCategoryService: BlogCategoryService, // Service này cần kế thừa BaseService
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();

    this.query.pageSize = 1000; // Mặc định 20 bản ghi/trang
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
        : // Nếu đang không sort gì cả, mặc định sort theo priority để hiển thị đúng thứ tự
          'priority:asc',
    };

    if (this.query.search?.trim()) {
      params.search = this.query.search.trim();
    }

    this.blogCategoryService.getAll(params).subscribe((data) => {
      this.dataSources = data.results || [];
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;

      this.dataSources.forEach((el: BlogCategory) => {
        el.coverImage = el.coverImage ? `${environment.urlBaseImage}${el.coverImage}` : '';
      });
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

  handleDeleteMany() {
    if (this.selected.length === 0) return;
    const dialogRef = this.dialog.open(this.confirmDeleteManyTpl, {
      data: { count: this.selected.length },
    });
    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.blogCategoryService.deleteMany(this.selected).subscribe({
          next: () => {
            this.toastr.success(
              `Đã xóa thành công ${this.selected.length} danh mục!`,
              'Thành công',
            );
            this.selected = [];
            this.fetchData();
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Có lỗi xảy ra khi xóa danh mục.', 'Lỗi');
          },
        });
      }
    });
  }

  // [5] Các hàm xử lý Drag & Drop
  toggleDragMode() {
    this.isDragMode.update((v) => !v);
    if (this.isDragMode()) {
      // Khi bật chế độ sắp xếp, nên reset sort về mặc định (priority) hoặc tải lại trang
      // Ở đây ta giữ nguyên data hiện tại để người dùng sắp xếp trên trang này
    }
  }

  drop(event: CdkDragDrop<BlogCategory[]>) {
    if (!this.isDragMode()) return;

    // 1. Cập nhật vị trí trên giao diện
    const prevIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    // Clone mảng để tránh mutation trực tiếp nếu cần, hoặc move trực tiếp trên dataSources
    moveItemInArray(this.dataSources, prevIndex, currentIndex);
    // Angular change detection có thể cần trigger nếu dùng OnPush,
    // nhưng ở đây component mặc định (Default) nên UI sẽ tự cập nhật.

    // 2. Tính toán lại priority
    // Logic: Lấy danh sách hiện tại, cập nhật priority = index
    // Lưu ý: Nếu đang ở trang 2, priority vẫn sẽ tính từ 0..pageSize.
    // Nếu muốn chính xác toàn cục, cần cộng thêm offset: (page - 1) * pageSize.
    const offset = (this.query.page - 1) * this.query.pageSize;

    const updateObservables = this.dataSources
      .map((item, index) => {
        const newPriority = offset + index;
        // Giả sử model BlogCategory chưa có field priority trong type, ta ép kiểu hoặc thêm vào model
        // Kiểm tra xem priority có thay đổi không để gọi API
        if ((item as any).priority !== newPriority) {
          // Cập nhật lại priority local để lần sau check
          (item as any).priority = newPriority;
          return this.blogCategoryService.update(item.id, { priority: newPriority });
        }
        return null;
      })
      .filter((obs) => obs !== null);

    if (updateObservables.length > 0) {
      this.isSavingOrder = true;
      forkJoin(updateObservables).subscribe({
        next: () => {
          this.toastr.success('Đã cập nhật thứ tự thành công!', 'Sắp xếp');
          this.isSavingOrder = false;
          // Không nhất thiết phải load lại nếu data local đã chuẩn, nhưng load lại cho chắc chắn
          this.fetchData();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Có lỗi xảy ra khi lưu thứ tự.', 'Lỗi');
          this.isSavingOrder = false;
          this.fetchData(); // Revert lại dữ liệu cũ nếu lỗi
        },
      });
    }
  }
}
