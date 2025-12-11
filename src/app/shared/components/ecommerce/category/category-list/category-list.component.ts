import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/api/category.service';
import { environment } from '../../../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '@ngneat/dialog';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { CheckboxComponent } from '../../../form/input/checkbox.component';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';

interface CategoryTree extends Category {
  children?: CategoryTree[];
  level?: number;
  expanded?: boolean;
  parent?: string | null;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HasPermissionDirective,
    CheckboxComponent,
    DragDropModule, // Import module DragDrop
  ],
  templateUrl: './category-list.component.html',
  styles: `
    /* 1. CSS bắt buộc của CDK để giữ form hàng khi kéo */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow:
        0 5px 5px -3px rgba(0, 0, 0, 0.2),
        0 8px 10px 1px rgba(0, 0, 0, 0.14),
        0 3px 14px 2px rgba(0, 0, 0, 0.12);
      background-color: white;
      display: table; /* Giữ layout bảng */
    }

    /* 2. Khoảng trống nơi sẽ thả xuống */
    .cdk-drag-placeholder {
      opacity: 0;
    }

    /* 3. QUAN TRỌNG NHẤT: Chỉ animate khi sắp xếp lại, KHÔNG animate khi đang kéo */
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* Các hàng khác trượt ra chỗ khác mượt mà */
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    /* 4. FIX LAG: Tắt transition của Tailwind khi đang kéo */
    .cdk-drag-preview,
    .cdk-drag-placeholder {
      transition: none !important;
    }

    /* Nếu thẻ tr của bạn có class 'transition' của tailwind, 
     CDK drag sẽ bị xung đột. Đoạn này fix đè lên */
    .cdk-drag {
      transition: none; /* Tắt transition mặc định để chuột dính chặt vào element */
    }

    /* Chỉ bật lại transition cho màu nền (hover) nếu cần, tránh dính vào transform */
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
export class CategoryListComponent implements OnInit {
  categories: Category[] = [];
  categoryTree = signal<CategoryTree[]>([]);
  flattenedTree = signal<CategoryTree[]>([]);
  selected: string[] = [];
  searchTerm: string = '';

  // State cho chế độ Drag Drop
  isDragMode = signal<boolean>(false);
  isSavingOrder = false;

  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  itemToDelete: Category | null = null;

  constructor(
    private toastr: ToastrService,
    private categoryService: CategoryService,
    private router: Router,
    private dialog: DialogService,
  ) {}

  ngOnInit() {
    this.loadCategories();
  }

  /** Load tất cả categories từ API */
  loadCategories() {
    this.categoryService.getAll({ limit: 1000, populate: 'createdBy' }).subscribe({
      next: (data) => {
        this.categories = data.results || [];
        // fix image url
        this.categories.forEach((el: Category) => {
          el.image = el.image ? `${environment.urlBaseImage}${el.image}` : '';
        });
        this.buildTree();
      },
      error: (err) => console.error('ERROR', err),
    });
  }

  /** Propagate trạng thái inactive từ parent xuống con */
  private propagateInactive(node: CategoryTree): void {
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        if (!node.isActive) {
          child.isActive = false; // inherit inactive
        }
        this.propagateInactive(child); // recursion
      });
    }
  }

  /** Build tree từ danh sách categories */
  buildTree(): void {
    const tree: CategoryTree[] = [];
    const map = new Map<string, CategoryTree>();

    // 1️⃣ Tạo map id → node
    this.categories.forEach((cat) => {
      const treeCat: CategoryTree = {
        ...cat,
        children: [],
        level: 0,
        expanded: true, // Mặc định mở hết để dễ nhìn khi sort
        parent: cat.parent || null,
      };
      map.set(cat.id!, treeCat);
    });

    // 2️⃣ Gán children
    map.forEach((cat) => {
      if (cat.parent) {
        const parent = map.get(cat.parent);
        if (parent) {
          parent.children!.push(cat);
        } else {
          tree.push(cat); // parent không tồn tại trong list load về, coi là gốc
        }
      } else {
        tree.push(cat); // node gốc
      }
    });

    // 3️⃣ Sắp xếp cây theo Priority (Quan trọng cho hiển thị đúng thứ tự)
    const sortRecursive = (nodes: CategoryTree[]) => {
      nodes.sort((a, b) => (a.priority || 0) - (b.priority || 0));
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortRecursive(node.children);
        }
      });
    };
    sortRecursive(tree);

    // 4️⃣ Propagate isActive từ parent xuống con
    tree.forEach((node) => this.propagateInactive(node));

    // 5️⃣ Set tree signal
    this.categoryTree.set(tree);

    // 6️⃣ Flatten để hiển thị bảng
    this.updateFlattenedTree();
  }

  /** Flatten tree để hiển thị bảng, áp dụng search và expanded */
  updateFlattenedTree(): void {
    const flattened: CategoryTree[] = [];

    const flatten = (items: CategoryTree[], level: number = 0) => {
      items.forEach((item) => {
        item.level = level;
        // áp dụng search filter
        if (!this.searchTerm || item.name.toLowerCase().includes(this.searchTerm.toLowerCase())) {
          flattened.push(item);
        }
        // Nếu đang ở chế độ Drag, luôn hiển thị con (nếu expanded) để dễ kéo thả trong nhóm
        if (item.expanded && item.children && item.children.length > 0) {
          flatten(item.children, level + 1);
        }
      });
    };

    flatten(this.categoryTree());
    this.flattenedTree.set(flattened);
  }

  /** Toggle expand/collapse node */
  toggleExpand(category: CategoryTree): void {
    // Không cho phép collapse khi đang ở chế độ Drag để tránh lỗi hiển thị
    if (this.isDragMode()) return;

    category.expanded = !category.expanded;
    this.updateFlattenedTree();
  }

  // ===================== Select =====================
  toggleSelect(id: string, checked: boolean) {
    if (checked) {
      if (!this.selected.includes(id)) {
        this.selected.push(id);
      }
    } else {
      this.selected = this.selected.filter((item) => item !== id);
    }
  }

  toggleAll(): void {
    const ids = this.flattenedTree().map((c) => c.id!) as string[];
    this.selected = this.isAllSelected()
      ? this.selected.filter((id) => !ids.includes(id))
      : [...new Set([...this.selected, ...ids])];
  }

  isAllSelected(): boolean {
    const ids = this.flattenedTree().map((c) => c.id!) as string[];
    return ids.length > 0 && ids.every((id) => this.selected.includes(id));
  }

  hasChildren(category: CategoryTree): boolean {
    return !!(category.children && category.children.length > 0);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.updateFlattenedTree();
  }

  handleEdit(category: Category) {
    this.router.navigate(['/category/edit', category.id]);
  }

  handleDelete(category: Category) {
    this.itemToDelete = category;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl, { data: {} });
    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.categoryService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Delete successfully!', 'Success');
          this.loadCategories();
        });
      }
      this.itemToDelete = null;
    });
  }

  // ===================== Drag & Drop Logic =====================

  toggleDragMode() {
    this.isDragMode.update((v) => !v);
    if (this.isDragMode()) {
      this.searchTerm = ''; // Xóa search để hiển thị đúng cấu trúc
      // Mở rộng tất cả để dễ kéo thả
      const expandAll = (nodes: CategoryTree[]) => {
        nodes.forEach((node) => {
          node.expanded = true;
          if (node.children) expandAll(node.children);
        });
      };
      expandAll(this.categoryTree());
      this.updateFlattenedTree();
    }
  }

  drop(event: CdkDragDrop<CategoryTree[]>) {
    if (!this.isDragMode()) return;

    // 1. Cập nhật vị trí trên giao diện (flattened array)
    const prevIndex = event.previousIndex;
    const currentIndex = event.currentIndex;

    const items = [...this.flattenedTree()];
    moveItemInArray(items, prevIndex, currentIndex);
    this.flattenedTree.set(items);

    // 2. Tính toán lại priority cho TẤT CẢ các item trong list
    // Priority càng nhỏ thì càng lên đầu
    const updateObservables = items
      .map((item, index) => {
        // Chỉ update nếu priority thay đổi để giảm tải server (hoặc update hết nếu muốn chắc chắn)
        if (item.priority !== index) {
          return this.categoryService.update(item.id!, { priority: index });
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
          // Load lại để đồng bộ chuẩn data từ server
          this.loadCategories();
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Có lỗi xảy ra khi lưu thứ tự.', 'Lỗi');
          this.isSavingOrder = false;
          this.loadCategories(); // Revert lại
        },
      });
    }
  }
}
