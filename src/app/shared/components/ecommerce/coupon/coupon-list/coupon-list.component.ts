import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Coupon } from '../../../../models/coupon.model';
import { CouponService } from '../../../../services/api/coupon.service';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-coupon-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
  ],
  templateUrl: './coupon-list.component.html',
  styles: ``,
})
export class CouponListComponent extends BaseListComponent<Coupon> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  itemToDelete: Coupon | null = null;

  constructor(
    private couponService: CouponService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('CouponListComponent init logic');
    // Call base init
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'applicableProducts,applicableCombos',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    this.couponService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  handleEdit(coupon: Coupon): void {
    this.router.navigate(['/coupon/edit', coupon.id]);
  }

  handleDelete(coupon: Coupon): void {
    this.itemToDelete = coupon;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.couponService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Delete successfully!', 'Coupon');
          this.fetchData();
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(coupon: Coupon): void {
    this.couponService.update(coupon.id, { isActive: !coupon.isActive }).subscribe({
      next: () => {
        coupon.isActive = !coupon.isActive;
        this.toastr.success('Update successfully!', 'Coupon');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Coupon');
      },
    });
  }

  // Check if coupon is expired
  isExpired(coupon: Coupon): boolean {
    const now = new Date();
    const endDate = new Date(coupon.endDate);
    return endDate < now;
  }

  // Check if coupon is fully used
  isFullyUsed(coupon: Coupon): boolean {
    return coupon.usedCount >= coupon.maxUses;
  }

  // Check if coupon is valid (not expired and not fully used)
  isValid(coupon: Coupon): boolean {
    return !this.isExpired(coupon) && !this.isFullyUsed(coupon) && coupon.isActive;
  }
}
