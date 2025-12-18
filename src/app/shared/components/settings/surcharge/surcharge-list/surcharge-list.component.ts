import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '@ngneat/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

import { Surcharge } from '../../../../models/surcharge.model';
import { SurchargeService } from '../../../../services/api/surcharge.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { CheckboxComponent } from '../../../form/input/checkbox.component';
import { SwitchComponent } from '../../../form/input/switch.component';

@Component({
  selector: 'app-surcharge-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    CheckboxComponent,
    DragDropModule,
    SwitchComponent,
  ],
  templateUrl: './surcharge-list.component.html',
  styles: `
    /* CSS cho Drag & Drop của CDK */
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
export class SurchargeListComponent implements OnInit {
  surcharges = signal<Surcharge[]>([]);
  filteredSurcharges = signal<Surcharge[]>([]);
  selected: string[] = [];
  searchTerm: string = '';

  isDragMode = signal<boolean>(false);
  isSavingOrder = false;

  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  itemToDelete: Surcharge | null = null;

  @ViewChild('confirmDeleteMany') confirmDeleteManyTpl!: TemplateRef<any>;

  constructor(
    private toastr: ToastrService,
    private surchargeService: SurchargeService,
    private router: Router,
    private dialog: DialogService,
  ) {}

  ngOnInit() {
    this.loadSurcharges();
  }

  loadSurcharges() {
    // Load tất cả để hỗ trợ client-side sorting/filtering tốt hơn cho list nhỏ
    this.surchargeService.getAll({ limit: 1000, sortBy: 'priority:asc' }).subscribe({
      next: (data) => {
        const items = data.results || [];
        // Sắp xếp theo priority
        items.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        this.surcharges.set(items);
        this.updateFilteredList();
      },
      error: (err) => console.error('ERROR', err),
    });
  }

  updateFilteredList() {
    let items = this.surcharges();
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(term));
    }
    this.filteredSurcharges.set(items);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.updateFilteredList();
  }

  // ===================== Selection =====================
  toggleSelect(id: string, checked: boolean) {
    if (checked) {
      if (!this.selected.includes(id)) this.selected.push(id);
    } else {
      this.selected = this.selected.filter((item) => item !== id);
    }
  }

  toggleAll() {
    const ids = this.filteredSurcharges().map((c) => c.id);
    this.selected = this.isAllSelected()
      ? this.selected.filter((id) => !ids.includes(id))
      : [...new Set([...this.selected, ...ids])];
  }

  isAllSelected(): boolean {
    const ids = this.filteredSurcharges().map((c) => c.id);
    return ids.length > 0 && ids.every((id) => this.selected.includes(id));
  }

  // ===================== Actions =====================
  handleEdit(item: Surcharge) {
    this.router.navigate(['/settings/surcharge/edit', item.id]);
  }

  handleDelete(item: Surcharge) {
    this.itemToDelete = item;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl, { data: {} });
    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.surchargeService.delete(this.itemToDelete.id).subscribe({
          next: () => {
            this.toastr.success('Xóa thành công!', 'Thành công');
            this.loadSurcharges();
          },
          error: () => this.toastr.error('Có lỗi xảy ra', 'Lỗi'),
        });
      }
      this.itemToDelete = null;
    });
  }

  handleDeleteMany() {
    if (this.selected.length === 0) return;
    const dialogRef = this.dialog.open(this.confirmDeleteManyTpl, {
      data: { count: this.selected.length },
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.surchargeService.deleteMany(this.selected).subscribe({
          next: () => {
            this.toastr.success(`Đã xóa ${this.selected.length} mục!`, 'Thành công');
            this.selected = [];
            this.loadSurcharges();
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Có lỗi xảy ra khi xóa.', 'Lỗi');
          },
        });
      }
    });
  }

  // ===================== Drag & Drop =====================
  toggleDragMode() {
    this.isDragMode.update((v) => !v);
    if (this.isDragMode()) {
      this.searchTerm = '';
      this.updateFilteredList(); // Reset filter để hiện full list khi sort
    }
  }

  drop(event: CdkDragDrop<Surcharge[]>) {
    if (!this.isDragMode()) return;

    const prevIndex = event.previousIndex;
    const currentIndex = event.currentIndex;
    const items = [...this.filteredSurcharges()];

    moveItemInArray(items, prevIndex, currentIndex);
    this.filteredSurcharges.set(items);

    // Cập nhật priority cho toàn bộ danh sách
    const updateObservables = items
      .map((item, index) => {
        if (item.priority !== index) {
          return this.surchargeService.update(item.id, { priority: index });
        }
        return null;
      })
      .filter((obs) => obs !== null);

    if (updateObservables.length > 0) {
      this.isSavingOrder = true;
      forkJoin(updateObservables).subscribe({
        next: () => {
          this.toastr.success('Đã cập nhật thứ tự!', 'Sắp xếp');
          this.isSavingOrder = false;
          // Không load lại ngay để tránh giật lag UI, user có thể tiếp tục kéo thả
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Lỗi khi lưu thứ tự.', 'Lỗi');
          this.isSavingOrder = false;
          this.loadSurcharges(); // Revert nếu lỗi
        },
      });
    }
  }

  handleToggleActive(item: Surcharge) {
    if (this.isDragMode()) return; // Không cho phép đổi trạng thái khi đang sắp xếp

    const newStatus = !item.isActive;
    this.surchargeService.update(item.id, { isActive: newStatus }).subscribe({
      next: () => {
        this.toastr.success(`Đã ${newStatus ? 'hiện' : 'ẩn'} phụ thu ${item.name}`, 'Thành công');
        // Cập nhật lại state local để UI đồng bộ
        this.surcharges.update((items) =>
          items.map((s) => (s.id === item.id ? { ...s, isActive: newStatus } : s)),
        );
        this.updateFilteredList();
      },
      error: () => {
        this.toastr.error('Không thể cập nhật trạng thái', 'Lỗi');
      },
    });
  }
}
