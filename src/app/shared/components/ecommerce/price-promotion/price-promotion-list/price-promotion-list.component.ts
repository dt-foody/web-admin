import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PricePromotion } from '../../../../models/price-promotion.model';
import { PricePromotionService } from '../../../../services/api/price-promotion.service';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-price-promotion-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
  ],
  templateUrl: './price-promotion-list.component.html',
  styles: ``,
})
export class PricePromotionListComponent
  extends BaseListComponent<PricePromotion>
  implements OnInit
{
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  itemToDelete: PricePromotion | null = null;

  constructor(
    private pricePromotionService: PricePromotionService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('PricePromotionListComponent init logic');
    // Call base init
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'product,combo',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    this.pricePromotionService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  handleEdit(promotion: PricePromotion): void {
    this.router.navigate(['/price-promotion/edit', promotion.id]);
  }

  handleDelete(promotion: PricePromotion): void {
    this.itemToDelete = promotion;
    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.pricePromotionService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Delete successfully!', 'Price Promotion');
          this.fetchData();
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(promotion: PricePromotion): void {
    this.pricePromotionService.update(promotion.id, { isActive: !promotion.isActive }).subscribe({
      next: () => {
        promotion.isActive = !promotion.isActive;
        this.toastr.success('Update successfully!', 'Price Promotion');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Price Promotion');
      },
    });
  }

  // Check if promotion is expired
  isExpired(promotion: PricePromotion): boolean {
    const now = new Date();
    const endDate = new Date(promotion.endDate);
    return endDate < now;
  }

  // Check if promotion is fully used
  isFullyUsed(promotion: PricePromotion): boolean {
    if (promotion.maxQuantity === 0) return false; // Unlimited
    return promotion.usedQuantity >= promotion.maxQuantity;
  }

  // Check if daily limit is reached
  isDailyLimitReached(promotion: PricePromotion): boolean {
    if (promotion.dailyMaxUses === 0) return false; // Unlimited
    return promotion.dailyUsedCount >= promotion.dailyMaxUses;
  }

  // Check if promotion is valid (not expired and not fully used)
  isValid(promotion: PricePromotion): boolean {
    return !this.isExpired(promotion) && !this.isFullyUsed(promotion) && promotion.isActive;
  }

  // Get applicable item name (product or combo)
  getApplicableItemName(promotion: PricePromotion): string {
    if (promotion.product) {
      return (promotion.product as any).name || 'Product';
    }
    if (promotion.combo) {
      return (promotion.combo as any).name || 'Combo';
    }
    return 'N/A';
  }

  // Get applicable item type
  getApplicableItemType(promotion: PricePromotion): 'product' | 'combo' | null {
    if (promotion.product) return 'product';
    if (promotion.combo) return 'combo';
    return null;
  }
}
