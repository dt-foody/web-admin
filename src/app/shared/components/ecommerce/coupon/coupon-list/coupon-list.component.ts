import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Coupon, CouponStatus } from '../../../../models/coupon.model'; // Import CouponStatus
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
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    CheckboxComponent,
    HasPermissionDirective,
    DatePipe,
  ],
  templateUrl: './coupon-list.component.html',
  styles: ``,
})
export class CouponListComponent extends BaseListComponent<Coupon> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  @ViewChild('confirmDeleteMany') confirmDeleteManyTpl!: TemplateRef<any>;

  itemToDelete: Coupon | null = null;

  // Cập nhật filter
  filterVisibility: 'all' | 'true' | 'false' = 'all'; // Thay đổi giá trị
  filterType: 'all' | 'discount_code' | 'freeship' | 'gift' = 'all';
  filterStatus: 'all' | CouponStatus = 'all'; // Thêm filter status

  visibilityOptions = [
    { value: 'all', label: 'Tất cả quyền xem' },
    { value: 'true', label: 'Công khai' },
    { value: 'false', label: 'Riêng tư' },
  ];

  typeOptions = [
    { value: 'all', label: 'Tất cả loại' },
    { value: 'discount_code', label: 'Mã giảm giá' },
    { value: 'freeship', label: 'Miễn phí vận chuyển' },
    { value: 'gift', label: 'Quà tặng' },
  ];

  statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'PAUSED', label: 'Tạm dừng' },
    { value: 'EXPIRED', label: 'Hết hạn' },
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
    super.ngOnInit();
  }

  /**
   * Lấy dữ liệu từ API
   */
  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      // populate: 'applicableProducts,applicableCombos', // XÓA: Các trường này không còn
      sortBy: this.query.sort?.key
        ? this.query.sort.key + ':' + (this.query.sort.asc ? 'asc' : 'desc')
        : undefined,
    };

    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    // Cập nhật filter
    if (this.filterVisibility !== 'all') {
      params.public = this.filterVisibility === 'true'; // Gửi boolean
    }
    if (this.filterType !== 'all') {
      params.type = this.filterType;
    }
    if (this.filterStatus !== 'all') {
      params.status = this.filterStatus; // Thêm filter status
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
   * Bật/tắt trạng thái (ACTIVE <-> PAUSED)
   */
  handleToggleStatus(coupon: Coupon): void {
    // Chỉ toggle giữa ACTIVE và PAUSED
    const newStatus = coupon.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    this.couponService.update(coupon.id, { status: newStatus }).subscribe({
      next: () => {
        coupon.status = newStatus; // Cập nhật local data
        this.toastr.success(`Status updated to ${newStatus}`, 'Coupon');
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
    // Ưu tiên trạng thái từ backend nếu có
    if (coupon.status === 'EXPIRED') return true;
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
    // Cập nhật để dùng status
    return !this.isExpired(coupon) && !this.isFullyUsed(coupon) && coupon.status === 'ACTIVE';
  }

  /**
   * Hiển thị giới hạn tổng
   */
  getMaxUsesDisplay(coupon: Coupon): string {
    return coupon.maxUses > 0 ? coupon.maxUses.toString() : '∞';
  }

  /**
   * XÓA: Hiển thị giới hạn hàng ngày
   */
  // getDailyMaxUsesDisplay(coupon: Coupon): string {
  //   return coupon.dailyMaxUses > 0 ? coupon.dailyMaxUses.toString() : '∞';
  // }

  /**
   * Hiển thị giới hạn mỗi người dùng
   */
  getMaxUsesPerUserDisplay(coupon: Coupon): string {
    return coupon.maxUsesPerUser > 0 ? coupon.maxUsesPerUser.toString() : '∞';
  }

  handleDeleteMany() {
    if (this.selected.length === 0) return;

    // Mở dialog xác nhận
    const dialogRef = this.dialog.open(this.confirmDeleteManyTpl, {
      data: { count: this.selected.length }, // Truyền số lượng để hiển thị
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed) {
        // Gọi service deleteMany
        this.couponService.deleteMany(this.selected).subscribe({
          next: () => {
            this.toastr.success(
              `Đã xóa thành công ${this.selected.length} mã giảm giá!`,
              'Thành công',
            );
            this.selected = []; // Reset danh sách chọn
            this.fetchData(); // Tải lại dữ liệu bảng
          },
          error: (err) => {
            console.error(err);
            this.toastr.error('Có lỗi xảy ra khi xóa mã giảm giá.', 'Lỗi');
          },
        });
      }
    });
  }
}
