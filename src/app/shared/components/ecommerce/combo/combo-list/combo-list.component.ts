import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Combo } from '../../../../models/combo.model';
import { ComboService } from '../../../../services/api/combo.service';
import { environment } from '../../../../../../environments/environment';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-combo-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
  ],
  templateUrl: './combo-list.component.html',
  styles: ``,
})
export class ComboListComponent extends BaseListComponent<Combo> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  itemToDelete: Combo | null = null;

  constructor(
    private comboService: ComboService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('ComboListComponent init logic');

    // Gọi lại base init
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'items.selectableProducts.product',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.name = this.query.search.trim();
    }

    this.comboService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;

      this.dataSources.forEach((el) => {
        el.thumbnailUrl = el.thumbnailUrl ? `${environment.urlBaseImage}${el.thumbnailUrl}` : '';
      });
    });
  }

  getItemsCount(combo: Combo): number {
    return combo.items?.length || 0;
  }

  getTotalProducts(combo: Combo): number {
    if (!combo.items) return 0;
    return combo.items.reduce((total, item) => total + (item.selectableProducts?.length || 0), 0);
  }

  isComboActive(combo: Combo): boolean {
    if (!combo.isActive) return false;

    const now = new Date();
    const start = new Date(combo.startDate);
    const end = new Date(combo.endDate);

    return now >= start && now <= end;
  }

  getComboStatus(combo: Combo): { label: string; color: string } {
    const now = new Date();
    const start = new Date(combo.startDate);
    const end = new Date(combo.endDate);

    if (!combo.isActive) {
      return { label: 'Inactive', color: 'gray' };
    }

    if (now < start) {
      return { label: 'Upcoming', color: 'blue' };
    }

    if (now > end) {
      return { label: 'Expired', color: 'red' };
    }

    return { label: 'Active', color: 'green' };
  }

  formatDateRange(startDate?: string | Date, endDate?: string | Date): string {
    if (!startDate || !endDate) return '-';
    return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
  }

  handleEdit(combo: Combo): void {
    this.router.navigate(['/combo/edit', combo.id]);
  }

  handleDelete(combo: Combo): void {
    this.itemToDelete = combo;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.comboService.delete(this.itemToDelete.id).subscribe({
          next: () => {
            this.toastr.success('Delete successfully!', 'Combo');
            this.fetchData();
          },
          error: (err) => {
            this.toastr.error(err?.error?.message || 'Delete failed!', 'Combo');
          },
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(combo: Combo): void {
    this.comboService.update(combo.id, { isActive: !combo.isActive }).subscribe({
      next: () => {
        combo.isActive = !combo.isActive;
        this.toastr.success('Update successfully!', 'Combo');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Combo');
      },
    });
  }
}
