import { CommonModule } from '@angular/common';
import { Component, signal, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Category } from '../../../../models/category.model';
import { CategoryService } from '../../../../services/api/category.service';
import { environment } from '../../../../../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { DialogService } from '@ngneat/dialog';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { CheckboxComponent } from '../../../form/input/checkbox.component';

interface CategoryTree extends Category {
  children?: CategoryTree[];
  level?: number;
  expanded?: boolean;
  parent?: string | null;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, RouterModule, HasPermissionDirective, CheckboxComponent],
  templateUrl: './category-list.component.html',
  styles: ``,
})
export class CategoryListComponent {
  categories: Category[] = [];
  categoryTree = signal<CategoryTree[]>([]);
  flattenedTree = signal<CategoryTree[]>([]);
  selected: string[] = [];
  searchTerm: string = '';

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
        expanded: true,
        parent: cat.parent || null,
      };
      map.set(cat.id!, treeCat);
    });
    // 2️⃣ Gán children
    map.forEach((cat) => {
      if (cat.parent) {
        const parent = map.get(cat.parent);
        if (parent) parent.children!.push(cat);
        else tree.push(cat); // parent không tồn tại, coi là gốc
      } else {
        tree.push(cat); // node gốc
      }
    });
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
    category.expanded = !category.expanded;
    this.updateFlattenedTree();
  }

  // ===================== Select =====================
  toggleSelect(id: string, checked: boolean) {
    if (checked) {
      // Thêm id nếu chưa có
      if (!this.selected.includes(id)) {
        this.selected.push(id);
      }
    } else {
      // Loại bỏ id nếu unchecked
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

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

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
}
