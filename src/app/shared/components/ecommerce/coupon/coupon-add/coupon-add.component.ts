import { Component, computed, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

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
import { Voucher } from '../../../../models/voucher.model';
import { ConditionGroup, Field, Operator } from '../../../../models/conditions.model';

// Services
import { CouponService } from '../../../../services/api/coupon.service';
import { VoucherService } from '../../../../services/api/voucher.service';
import { CustomerService } from '../../../../services/api/customer.service';
import { CategoryService } from '../../../../services/api/category.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';

// Utils
import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';
import { Customer } from '../../../../models/customer.model';

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

// Form phát hành voucher
interface VoucherIssueFormData {
  customerIds: string[];
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

  allCustomers: Customer[] = [];
  issuedVouchers: Voucher[] = [];
  voucherIssueForm: VoucherIssueFormData = {
    customerIds: [],
    usageLimit: 1,
    expiredAt: null,
  };
  isLoadingVoucherData = false;

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
      id: 'customer_is_new',
      group: 'Khách hàng',
      name: 'Khách hàng mới',
      type: 'boolean',
      operators: [Operator.EQUALS, Operator.NOT_EQUALS],
    },
    // {
    //   id: 'product_id',
    //   group: 'Sản phẩm',
    //   name: 'Sản phẩm',
    //   type: 'multi-select',
    //   operators: [Operator.IN, Operator.NOT_IN],
    //   source: {
    //     valueField: 'id',
    //     labelField: 'name',
    //     optionsLoader: (params) => this.productService.getAll({ ...params }),
    //   },
    // },
    // {
    //   id: 'combo_id',
    //   group: 'Combo',
    //   name: 'Combo',
    //   type: 'multi-select',
    //   operators: [Operator.IN, Operator.NOT_IN],
    //   source: {
    //     valueField: 'id',
    //     labelField: 'name',
    //     optionsLoader: (params) => this.comboService.getAll({ ...params }),
    //   },
    // },
    // {
    //   id: 'category_id',
    //   group: 'Danh mục',
    //   name: 'Danh mục',
    //   type: 'multi-select',
    //   operators: [Operator.IN, Operator.NOT_IN],
    //   source: {
    //     valueField: 'id',
    //     labelField: 'name',
    //     optionsLoader: (params) => this.categoryService.getAll({ ...params }),
    //   },
    // },
    {
      id: 'order_count',
      group: 'Đơn hàng',
      name: 'Số lượng đơn hàng',
      type: 'number',
      operators: [Operator.EQUALS, Operator.GREATER_THAN, Operator.LESS_THAN],
    },
    {
      id: 'order_date',
      group: 'Đơn hàng',
      name: 'Ngày đặt hàng',
      type: 'date',
      operators: [Operator.BEFORE, Operator.AFTER, Operator.BETWEEN],
    },
    {
      id: 'order_contains_product_count',
      group: 'Đơn hàng',
      name: 'Số lượng sản phẩm trong đơn',
      type: 'number',
      operators: [Operator.GREATER_THAN, Operator.LESS_THAN, Operator.EQUALS],
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
        this.loadVoucherData(id);
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

  loadVoucherData(couponId: string) {
    this.isLoadingVoucherData = true;
    forkJoin({
      customers: this.customerService.getAll({ limit: 2000 }),
      vouchers: this.voucherService.getAll({
        coupon: couponId,
        limit: 1000,
        populate: 'customer',
        sortBy: 'createdAt:desc',
      }),
    }).subscribe({
      next: ({ customers, vouchers }) => {
        this.allCustomers = customers.results || [];
        this.issuedVouchers = vouchers.results || [];
        this.isLoadingVoucherData = false;
      },
      error: (err) => {
        console.error('Error loading voucher data:', err);
        this.toastr.error('Could not load customer or voucher list', 'Error');
        this.isLoadingVoucherData = false;
      },
    });
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

  onIssueVouchers() {
    if (!this.couponId) return;
    if (!this.voucherIssueForm.customerIds || this.voucherIssueForm.customerIds.length === 0) {
      this.toastr.error('Please select at least one customer', 'Error');
      return;
    }
    // const payload = {
    //   coupon: this.couponId,
    //   customers: this.voucherIssueForm.customerIds,
    //   issueMode: 'ADMIN',
    //   usageLimit: this.voucherIssueForm.usageLimit || 1,
    //   expiredAt: this.voucherIssueForm.expiredAt || undefined,
    // };
    // this.voucherService.bulkIssue(payload).subscribe({
    //   next: (result: any) => {
    //     this.toastr.success(`Successfully issued ${result.createdCount || 0} vouchers!`, 'Success');
    //     this.voucherIssueForm.customerIds = [];
    //     this.loadVoucherData(this.couponId!);
    //   },
    //   error: (err) => {
    //     console.error('Error issuing vouchers:', err);
    //     this.toastr.error(err?.error?.message || 'Failed to issue vouchers', 'Error');
    //   },
    // });
  }

  onRevokeVoucher(voucher: Voucher) {
    if (
      !confirm(`Are you sure you want to revoke voucher ${voucher.code}? This cannot be undone.`)
    ) {
      return;
    }
    // this.voucherService.revoke(voucher.id).subscribe({
    //   next: () => {
    //     this.toastr.success(`Voucher ${voucher.code} has been revoked.`, 'Success');
    //     const index = this.issuedVouchers.findIndex((v) => v.id === voucher.id);
    //     if (index > -1) {
    //       this.issuedVouchers[index].status = 'REVOKED';
    //       this.issuedVouchers[index].revokeAt = new Date();
    //     }
    //   },
    //   error: (err: any) => {
    //     console.error('Error revoking voucher:', err);
    //     this.toastr.error(err?.error?.message || 'Failed to revoke voucher', 'Error');
    //   },
    // });
  }

  profileName(voucher: Voucher): string {
    const p = voucher?.profile;
    return typeof p === 'string' ? p : (p?.name ?? '');
  }
}
