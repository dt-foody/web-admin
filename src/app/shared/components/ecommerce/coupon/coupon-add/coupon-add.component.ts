import { Component, computed, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable, of } from 'rxjs';

import { ConditionsBuilderComponent } from '../../../form/conditions-builder/conditions-builder.component';

// Component UI
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { SwitchComponent } from '../../../form/input/switch.component';

// Models
import { Coupon, CouponFormData } from '../../../../models/coupon.model';
import { Voucher, VoucherProfileType } from '../../../../models/voucher.model';
import { ConditionGroup, Field, Operator } from '../../../../models/conditions.model';

// Services
import { CouponService } from '../../../../services/api/coupon.service';
import { VoucherService } from '../../../../services/api/voucher.service';
import { CustomerService } from '../../../../services/api/customer.service';
import { EmployeeService } from '../../../../services/api/employee.service'; // [NEW]
import { CategoryService } from '../../../../services/api/category.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';

// Utils
import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';

// ========= Defaults =========
const DEFAULT_FORM: CouponFormData = {
  name: '',
  description: '',
  code: '',
  type: 'discount_code',
  value: 0,
  valueType: 'percentage',
  maxDiscountAmount: 0,
  minOrderAmount: 0,
  startDate: '',
  endDate: '',
  maxUses: 0,
  maxUsesPerUser: 1,
  public: true,
  claimable: false,
  autoApply: false,
  stackable: false,
  conditions: null,
  status: 'DRAFT',
};

// Form phát hành voucher (Updated)
interface VoucherIssueFormData {
  profileType: VoucherProfileType; // [NEW] Loại đối tượng
  profileIds: string[]; // [RENAMED] Thay vì customerIds
  usageLimit: number;
  expiredAt: string | null;
}

@Component({
  selector: 'app-coupon-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    SwitchComponent,
    DatePipe,
    ConditionsBuilderComponent,
  ],
  templateUrl: './coupon-add.component.html',
  styles: ``,
})
export class CouponAddComponent implements OnInit {
  couponId: string | null = null;
  isEditMode = false;

  couponData = createFormData(DEFAULT_FORM);

  currentTab: 'details' | 'vouchers' = 'details';

  // [UPDATED] Data sources cho voucher
  profilesList: any[] = []; // List dynamic (Customer hoặc Employee)
  issuedVouchers: Voucher[] = [];

  voucherIssueForm: VoucherIssueFormData = {
    profileType: 'Customer', // Mặc định là khách
    profileIds: [],
    usageLimit: 1,
    expiredAt: null,
  };

  isLoadingVoucherData = false;
  isIssuing = false; // Loading state cho nút phát hành

  // Options
  profileTypeOptions = [
    { value: 'Customer', label: 'Khách hàng' },
    { value: 'Employee', label: 'Nhân viên' },
  ];

  valueTypeOptions = [
    { value: 'percentage', label: 'Phần trăm (%)' },
    { value: 'fixed_amount', label: 'Số tiền cố định' },
  ];

  typeOptions = [
    { value: 'discount_code', label: 'Mã giảm giá' },
    { value: 'freeship', label: 'Miễn phí vận chuyển' },
    // { value: 'gift', label: 'Quà tặng' },
  ];

  statusOptions = [
    { value: 'DRAFT', label: 'Nháp' },
    { value: 'ACTIVE', label: 'Đang hoạt động' },
    { value: 'PAUSED', label: 'Tạm dừng' },
    { value: 'EXPIRED', label: 'Hết hạn' },
  ];

  fields: Field[] = [
    {
      id: 'customer_name',
      group: 'Khách hàng',
      name: 'Tên khách hàng',
      type: 'text',
      operators: [
        Operator.EQUALS,
        Operator.NOT_EQUALS,
        Operator.CONTAINS,
        Operator.DOES_NOT_CONTAIN,
        Operator.IS_EMPTY,
        Operator.IS_NOT_EMPTY,
      ],
    },
    {
      id: 'customer_age',
      group: 'Khách hàng',
      name: 'Tuổi khách hàng',
      type: 'number',
      operators: [Operator.EQUALS, Operator.GREATER_THAN, Operator.LESS_THAN],
    },
    {
      id: 'customer_birth_month',
      group: 'Khách hàng',
      name: 'Tháng sinh nhật',
      type: 'number', // Dùng number để nhập tháng 1-12
      operators: [
        Operator.EQUALS,
        Operator.IN, // Cho phép chọn nhiều tháng (ví dụ: tháng 1, 2, 3)
        Operator.BETWEEN, // Trong khoảng tháng
      ],
    },
    {
      id: 'customer_birth_year',
      group: 'Khách hàng',
      name: 'Năm sinh',
      type: 'number',
      operators: [
        Operator.EQUALS,
        Operator.GREATER_THAN, // Sinh sau năm X
        Operator.LESS_THAN, // Sinh trước năm X
        Operator.BETWEEN, // Thế hệ GenZ, GenY...
      ],
    },
    {
      id: 'customer_gender',
      group: 'Khách hàng',
      name: 'Giới tính',
      type: 'multi-select', // Cần cấu hình source optionsLoader trả về ['Nam', 'Nữ', 'Khác']
      operators: [Operator.IN, Operator.NOT_IN],
      // Lưu ý: Bạn cần implement source ở đây hoặc xử lý riêng trong component
      source: {
        valueField: 'code', // Tên thuộc tính dùng làm giá trị lưu (ví dụ: 'male')
        labelField: 'name', // Tên thuộc tính hiển thị (ví dụ: 'Nam')
        optionsLoader: (params) => {
          // 1. Khai báo danh sách cứng
          const genders = [
            { code: 'male', name: 'Nam' },
            { code: 'female', name: 'Nữ' },
            { code: 'other', name: 'Khác' },
          ];

          // 2. Xử lý tìm kiếm (nếu người dùng gõ trong dropdown)
          let filtered = genders;
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            filtered = genders.filter((g) => g.name.toLowerCase().includes(searchLower));
          }

          // 3. Trả về dạng Observable<PaginatedResponse> giả lập
          return of({
            results: filtered,
            page: 1,
            limit: 100, // Trả về tất cả vì danh sách ngắn
            totalPages: 1,
            totalResults: filtered.length,
          });
        },
      },
    },
    {
      id: 'customer_order_count',
      group: 'Đơn hàng',
      name: 'Số lượng đơn hàng',
      type: 'number',
      operators: [Operator.EQUALS, Operator.GREATER_THAN, Operator.LESS_THAN],
    },
    {
      id: 'customer_total_spent',
      group: 'Đơn hàng',
      name: 'Tổng lịch sử mua hàng (VNĐ)',
      type: 'number',
      operators: [
        Operator.GREATER_THAN, // Khách VIP > 10tr
        Operator.LESS_THAN,
        Operator.BETWEEN,
        Operator.EQUALS,
      ],
    },
    {
      id: 'order_total_items',
      group: 'Đơn hàng',
      name: 'Số lượng sản phẩm trong đơn',
      type: 'number',
      operators: [Operator.GREATER_THAN, Operator.LESS_THAN, Operator.EQUALS],
    },
    {
      id: 'customer_default_address_district',
      group: 'Địa chỉ',
      name: 'Quận',
      type: 'multi-select',
      operators: [Operator.IN, Operator.NOT_IN],
      source: {
        valueField: 'label', // Lưu text quận xuống DB
        labelField: 'label', // Hiển thị
        optionsLoader: (params) => {
          const districts = [
            { label: 'Quận Ba Đình' },
            { label: 'Quận Cầu Giấy' },
            { label: 'Quận Đống Đa' },
            { label: 'Quận Hai Bà Trưng' },
            { label: 'Quận Hoàn Kiếm' },
            { label: 'Quận Thanh Xuân' },
            { label: 'Quận Hoàng Mai' },
            { label: 'Quận Long Biên' },
            { label: 'Quận Hà Đông' },
            { label: 'Quận Tây Hồ' },
            { label: 'Quận Nam Từ Liêm' },
            { label: 'Quận Bắc Từ Liêm' },
          ];

          // Search
          let filtered = districts;
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            filtered = districts.filter((d) => d.label.toLowerCase().includes(searchLower));
          }

          return of({
            results: filtered,
            page: 1,
            limit: 100,
            totalPages: 1,
            totalResults: filtered.length,
          });
        },
      },
    },
    {
      id: 'current_day_of_week',
      group: 'Thứ ngày',
      name: 'Thứ trong tuần',
      type: 'multi-select', // Hoặc 'number' (2-8) tùy logic backend của bạn
      operators: [
        // Operator.EQUALS, // Ví dụ: Thứ 2
        Operator.IN, // Ví dụ: Thứ 7, Chủ Nhật (Cuối tuần)
        Operator.NOT_IN,
      ],
      // Lưu ý: Cần optionsLoader trả về: [{id: 1, label: 'Thứ 2'}, ..., {id: 0, label: 'Chủ Nhật'}]
      source: {
        valueField: 'id', // Giá trị lưu xuống DB (1, 2, ..., 0)
        labelField: 'label', // Giá trị hiển thị (Thứ 2, ..., Chủ Nhật)
        optionsLoader: (params) => {
          // 1. Danh sách thứ trong tuần (Theo quy ước VN: 1=Thứ 2 ... 0=Chủ Nhật)
          const days = [
            { id: 1, label: 'Thứ 2' },
            { id: 2, label: 'Thứ 3' },
            { id: 3, label: 'Thứ 4' },
            { id: 4, label: 'Thứ 5' },
            { id: 5, label: 'Thứ 6' },
            { id: 6, label: 'Thứ 7' },
            { id: 0, label: 'Chủ Nhật' },
          ];

          // 2. Xử lý tìm kiếm
          let filtered = days;
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            filtered = days.filter((d) => d.label.toLowerCase().includes(searchLower));
          }

          // 3. Trả về Observable
          return of({
            results: filtered,
            page: 1,
            limit: 100,
            totalPages: 1,
            totalResults: filtered.length,
          });
        },
      },
    },
  ];

  // The root condition group state, managed by the parent component
  rootGroup: WritableSignal<ConditionGroup> = signal<ConditionGroup>({
    id: 'root',
    operator: 'AND',
    conditions: [],
  });

  constructor(
    private couponService: CouponService,
    private voucherService: VoucherService,
    private customerService: CustomerService,
    private employeeService: EmployeeService, // [NEW]
    private categoryService: CategoryService,
    private productService: ProductService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private comboService: ComboService,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.couponId = id;
        this.loadCoupon(id);
        // Load dữ liệu cho tab Voucher
        this.loadIssuedVouchers(id);
        this.loadProfiles('Customer'); // Mặc định load khách
      } else {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);
        this.couponData.startDate = this.formatDateTimeLocal(now);
        this.couponData.endDate = this.formatDateTimeLocal(endDate);
        this.couponData.status = 'DRAFT';
      }
    });
  }

  loadCoupon(id: string) {
    this.couponService.getById(id).subscribe({
      next: (data: Coupon) => {
        this.couponData = {
          ...createFormData(DEFAULT_FORM),
          ...data,
          startDate: this.formatDateTimeLocal(new Date(data.startDate)),
          endDate: this.formatDateTimeLocal(new Date(data.endDate)),
          conditions: data.conditions || null,
          maxDiscountAmount: data.maxDiscountAmount ?? 0,
          code: data.code ?? '',
        };

        // ✅ Nếu coupon đã có điều kiện (rootGroup đã được build), set lại vào builder
        if (data.conditions) {
          this.rootGroup.set(data.conditions);
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load coupon data', 'Error');
      },
    });
  }

  // [UPDATED] Load danh sách voucher đã phát hành
  loadIssuedVouchers(couponId: string) {
    this.voucherService
      .getAll({
        coupon: couponId,
        limit: 1000,
        populate: 'profile', // Populate dynamic path
        sortBy: 'createdAt:desc',
      })
      .subscribe({
        next: (res) => {
          this.issuedVouchers = res.results || [];
        },
        error: (err) => console.error('Error loading vouchers:', err),
      });
  }

  // [NEW] Load danh sách Profile (Khách hoặc Nhân viên) để chọn
  loadProfiles(type: VoucherProfileType) {
    this.isLoadingVoucherData = true;
    this.profilesList = []; // Clear danh sách cũ

    const obs: Observable<any> =
      type === 'Employee'
        ? this.employeeService.getAll({ limit: 2000 })
        : this.customerService.getAll({ limit: 2000 });

    obs.subscribe({
      next: (res: any) => {
        // Map dữ liệu về chuẩn chung để ng-select hiển thị
        this.profilesList = (res.results || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          label: `${item.name} (${item.phone || item.email || 'No contact'})`,
        }));
        this.isLoadingVoucherData = false;
      },
      error: (err: any) => {
        console.error('Error loading profiles:', err);
        this.toastr.error('Lỗi tải danh sách người dùng', 'Error');
        this.isLoadingVoucherData = false;
      },
    });
  }

  // [NEW] Sự kiện khi đổi loại đối tượng nhận voucher
  onProfileTypeChange(type: any) {
    if (!type) return;
    this.voucherIssueForm.profileIds = []; // Reset selection
    this.loadProfiles(type);
  }

  formatDateTimeLocal(date: Date): string {
    if (!date || !(date instanceof Date)) return '';
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d}T${hh}:${mm}`;
    } catch (e) {
      console.error('Error formatting date:', e, date);
      return '';
    }
  }

  validateForm(): boolean {
    if (!this.couponData.name?.trim()) {
      this.toastr.error('Coupon name is required', 'Validation Error');
      return false;
    }
    if (this.couponData.value < 0) {
      this.toastr.error('Discount value must be 0 or more', 'Validation Error');
      return false;
    }
    if (this.couponData.valueType === 'percentage' && this.couponData.value > 100) {
      this.toastr.error('Percentage discount cannot exceed 100%', 'Validation Error');
      return false;
    }
    if (this.couponData.valueType === 'percentage' && this.couponData.maxDiscountAmount < 0) {
      this.toastr.error('Max discount amount must be 0 or more', 'Validation Error');
      return false;
    }
    if (!this.couponData.startDate || !this.couponData.endDate) {
      this.toastr.error('Start date and end date are required', 'Validation Error');
      return false;
    }
    const startDate = new Date(this.couponData.startDate);
    const endDate = new Date(this.couponData.endDate);
    if (endDate <= startDate) {
      this.toastr.error('End date must be after start date', 'Validation Error');
      return false;
    }
    if (this.couponData.maxUses < 0) {
      this.toastr.error('Maximum total uses must be 0 or more', 'Validation Error');
      return false;
    }
    if (this.couponData.maxUsesPerUser <= 0) {
      this.toastr.error('Maximum uses per user must be at least 1', 'Validation Error');
      return false;
    }
    if (!this.couponData.status) {
      this.toastr.error('Status is required', 'Validation Error');
      return false;
    }

    return true;
  }

  onSave(andContinue: boolean = false) {
    console.log('rootGroup', this.rootGroup());
    if (this.currentTab !== 'details') {
      this.toastr.info('Please switch to the "Coupon Details" tab to save changes.');
      return;
    }
    if (!this.validateForm()) return;

    const validKeys = Object.keys(DEFAULT_FORM) as (keyof CouponFormData)[];
    const sanitized = sanitizeFormData<CouponFormData>(this.couponData, validKeys);

    if (sanitized.valueType === 'fixed_amount') {
      sanitized.maxDiscountAmount = 0;
    }
    if (sanitized.maxDiscountAmount == null) {
      sanitized.maxDiscountAmount = 0;
    }
    if (!sanitized.code?.trim()) {
      (sanitized as any).code = null;
    }

    // ✅ THÊM DÒNG NÀY - GẮN rootGroup.conditions VÀO
    if (this.rootGroup()) {
      (sanitized as any).conditions = this.rootGroup();
    }

    const obs =
      this.isEditMode && this.couponId
        ? this.couponService.update(this.couponId, sanitized as any)
        : this.couponService.create(sanitized as any);

    obs.subscribe({
      next: (response: any) => {
        this.toastr.success(
          this.isEditMode ? 'Coupon updated successfully!' : 'Coupon created successfully!',
          'Success',
        );
        const couponId = this.couponId || response.id;
        if (andContinue) {
          if (!this.isEditMode) {
            this.router.navigate(['/coupon/edit', couponId]);
          } else {
            this.loadCoupon(couponId);
          }
        } else {
          this.router.navigateByUrl('/coupon');
        }
      },
      error: (err) => {
        console.error(err);
        const message =
          err?.error?.message || (this.isEditMode ? 'Update failed!' : 'Create failed!');
        this.toastr.error(message, 'Error');
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/coupon');
  }

  // [UPDATED] Logic phát hành voucher (Bulk Issue)
  onIssueVouchers() {
    if (!this.couponId) return;
    if (!this.voucherIssueForm.profileIds || this.voucherIssueForm.profileIds.length === 0) {
      this.toastr.error('Vui lòng chọn ít nhất một người nhận', 'Error');
      return;
    }

    this.isIssuing = true;

    // Tạo mảng request để gửi song song (Giả lập bulk create nếu API chưa support)
    const requests = this.voucherIssueForm.profileIds.map((profileId) => {
      const payload = {
        coupon: this.couponId,
        profile: profileId,
        profileType: this.voucherIssueForm.profileType,
        issueMode: 'ADMIN',
        usageLimit: this.voucherIssueForm.usageLimit || 1,
        // Nếu không chọn ngày hết hạn riêng, lấy ngày hết hạn của coupon
        expiredAt: this.voucherIssueForm.expiredAt || this.couponData.endDate,
      };
      // Gọi create của voucher service
      return this.voucherService.create(payload as any);
    });

    forkJoin(requests).subscribe({
      next: (results) => {
        this.toastr.success(`Đã phát hành thành công ${results.length} voucher!`, 'Success');
        this.voucherIssueForm.profileIds = []; // Clear form
        this.isIssuing = false;
        this.loadIssuedVouchers(this.couponId!); // Reload list
      },
      error: (err) => {
        console.error('Error issuing vouchers:', err);
        this.toastr.error(err?.error?.message || 'Có lỗi khi phát hành voucher', 'Error');
        this.isIssuing = false;
      },
    });
  }

  // [UPDATED] Logic Thu Hồi
  onRevokeVoucher(voucher: Voucher) {
    if (
      !confirm(
        `Bạn có chắc muốn thu hồi mã ${voucher.code}? Khách hàng sẽ không thể sử dụng mã này nữa.`,
      )
    ) {
      return;
    }

    this.voucherService.revoke(voucher.id).subscribe({
      next: () => {
        this.toastr.success(`Đã thu hồi voucher ${voucher.code}.`, 'Success');
        // Cập nhật UI local
        const index = this.issuedVouchers.findIndex((v) => v.id === voucher.id);
        if (index > -1) {
          this.issuedVouchers[index].status = 'REVOKED';
          this.issuedVouchers[index].revokeAt = new Date();
        }
      },
      error: (err: any) => {
        console.error('Error revoking voucher:', err);
        this.toastr.error(err?.error?.message || 'Failed to revoke voucher', 'Error');
      },
    });
  }

  // [UPDATED] Helper hiển thị tên Profile
  profileName(voucher: Voucher): string {
    const p: any = voucher?.profile;
    if (!p) return 'N/A';

    // Nếu profile là object (đã populate)
    if (typeof p === 'object' && p.name) {
      const typeLabel = voucher.profileType === 'Employee' ? '(NV)' : '';
      return `${p.name} ${typeLabel}`;
    }
    return 'ID: ' + p;
  }
}
