import { CommonModule, DatePipe } from '@angular/common';
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
import { CheckboxComponent } from '../../../form/input/checkbox.component';

@Component({
  selector: 'app-coupon-list',
  standalone: true, // Đảm bảo component là standalone
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    CheckboxComponent,
    HasPermissionDirective,
    DatePipe, // Thêm DatePipe để sử dụng trong template gốc
  ],
  templateUrl: './coupon-list.component.html',
  styles: ``,
})
export class CouponListComponent extends BaseListComponent<Coupon> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  itemToDelete: Coupon | null = null;

  // Thêm các tùy chọn filter
  filterVisibility: 'all' | 'public' | 'private' = 'all';
  filterType: 'all' | 'discount_code' | 'freeship' | 'gift' = 'all';

  visibilityOptions = [
    { value: 'all', label: 'All Visibilities' },
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' },
  ];
  
  typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'discount_code', label: 'Discount Code' },
    { value: 'freeship', label: 'Free Shipping' },
    { value: 'gift', label: 'Gift' },
  ];

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

  /**
   * Lấy dữ liệu từ API
   */
  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      // Bỏ populate 'applicableUsers' để tối ưu performance
      populate: 'applicableProducts,applicableCombos',
      sortBy: this.query.sort?.key ? (this.query.sort.key + ':' + (this.query.sort.asc ? 'asc' : 'desc')) : undefined,
    };

    // Thêm query tìm kiếm
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }
    
    // Thêm các tham số filter
    if (this.filterVisibility !== 'all') {
      params.visibility = this.filterVisibility;
    }
    if (this.filterType !== 'all') {
      params.type = this.filterType;
    }

    this.couponService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }
  
  /**
   * Áp dụng filter và reset về trang 1
   */
  applyFilters(): void {
    this.query.page = 1;
    this.fetchData();
  }

  /**
   * Điều hướng đến trang chỉnh sửa
   */
  handleEdit(coupon: Coupon): void {
    this.router.navigate(['/coupon/edit', coupon.id]);
  }

  /**
   * Xử lý xóa (mở dialog xác nhận)
   */
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

  /**
   * Bật/tắt trạng thái Active
   */
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

  // --- Các hàm Helper để hiển thị ---

  /**
   * Kiểm tra coupon đã hết hạn
   */
  isExpired(coupon: Coupon): boolean {
    const now = new Date();
    const endDate = new Date(coupon.endDate);
    return endDate < now;
  }

  /**
   * Kiểm tra coupon đã hết lượt sử dụng
   * (0 = không giới hạn)
   */
  isFullyUsed(coupon: Coupon): boolean {
    if (coupon.maxUses <= 0) {
      return false; // 0 nghĩa là không giới hạn
    }
    return coupon.usedCount >= coupon.maxUses;
  }

  /**
   * Kiểm tra coupon còn hợp lệ
   */
  isValid(coupon: Coupon): boolean {
    return !this.isExpired(coupon) && !this.isFullyUsed(coupon) && coupon.isActive;
  }
  
  /**
   * Hiển thị giới hạn tổng
   */
  getMaxUsesDisplay(coupon: Coupon): string {
    return coupon.maxUses > 0 ? coupon.maxUses.toString() : 'Unlimited';
  }
  
  /**
   * Hiển thị giới hạn hàng ngày
   */
  getDailyMaxUsesDisplay(coupon: Coupon): string {
    return coupon.dailyMaxUses > 0 ? coupon.dailyMaxUses.toString() : 'Unlimited';
  }

  /**
   * Hiển thị giới hạn mỗi người dùng
   */
  getMaxUsesPerUserDisplay(coupon: Coupon): string {
    return coupon.maxUsesPerUser > 0 ? coupon.maxUsesPerUser.toString() : 'Unlimited';
  }
}