import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { CouponFormData } from '../../../../models/coupon.model';
import { CouponService } from '../../../../services/api/coupon.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';

const DEFAULT_FORM: CouponFormData = {
  name: '',
  description: '',
  type: 'coupon',
  code: '',
  applicableProducts: [],
  applicableCombos: [],
  value: 0,
  valueType: 'percentage',
  minOrderAmount: 0,
  startDate: '',
  endDate: '',
  maxUses: 0,
  dailyMaxUses: 0,
  isActive: true,
};

@Component({
  selector: 'app-coupon-add',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
  ],
  templateUrl: './coupon-add.component.html',
  styles: ``,
})
export class CouponAddComponent implements OnInit {
  couponId: string | null = null;
  isEditMode: boolean = false;

  // Form data
  couponData = createFormData(DEFAULT_FORM);

  // Dropdown options
  products: any[] = [];
  combos: any[] = [];

  statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  valueTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' },
  ];

  constructor(
    private couponService: CouponService,
    private productService: ProductService,
    private comboService: ComboService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadCombos();

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.couponId = id;
        this.loadCoupon(id);
      } else {
        // Set default dates for new coupon
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Default 30 days validity

        this.couponData.startDate = this.formatDateTimeLocal(now);
        this.couponData.endDate = this.formatDateTimeLocal(endDate);
      }
    });
  }

  loadCoupon(id: string) {
    this.couponService.getById(id).subscribe({
      next: (data: any) => {
        this.couponData = {
          ...data,
          startDate: this.formatDateTimeLocal(new Date(data.startDate)),
          endDate: this.formatDateTimeLocal(new Date(data.endDate)),
          applicableProducts: data.applicableProducts?.map((p: any) => p.id || p) || [],
          applicableCombos: data.applicableCombos?.map((c: any) => c.id || c) || [],
        };
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load coupon data', 'Error');
      },
    });
  }

  loadProducts() {
    this.productService.getAll({ limit: 1000, isActive: true }).subscribe({
      next: (data) => {
        if (data?.results?.length) {
          this.products = data.results;
        }
      },
      error: (err) => {
        console.error('Error loading products:', err);
      },
    });
  }

  loadCombos() {
    this.comboService.getAll({ limit: 1000, isActive: true }).subscribe({
      next: (data) => {
        if (data?.results?.length) {
          this.combos = data.results;
        }
      },
      error: (err) => {
        console.error('Error loading combos:', err);
      },
    });
  }

  // Format date for datetime-local input
  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  handleSelectChange(field: keyof CouponFormData, value: string) {
    if (field === 'isActive') {
      this.couponData[field] = value === 'true';
    } else {
      (this.couponData as any)[field] = value;
    }
  }

  // Validate form
  validateForm(): boolean {
    if (!this.couponData.name.trim()) {
      this.toastr.error('Coupon name is required', 'Validation Error');
      return false;
    }

    if (!this.couponData.code?.trim()) {
      this.toastr.error('Coupon code is required', 'Validation Error');
      return false;
    }

    if (this.couponData.value <= 0) {
      this.toastr.error('Discount value must be greater than 0', 'Validation Error');
      return false;
    }

    if (this.couponData.valueType === 'percentage' && this.couponData.value > 100) {
      this.toastr.error('Percentage discount cannot exceed 100%', 'Validation Error');
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

    if (this.couponData.maxUses <= 0) {
      this.toastr.error('Maximum uses must be greater than 0', 'Validation Error');
      return false;
    }

    if (this.couponData.dailyMaxUses <= 0) {
      this.toastr.error('Daily maximum uses must be greater than 0', 'Validation Error');
      return false;
    }

    if (this.couponData.dailyMaxUses > this.couponData.maxUses) {
      this.toastr.error('Daily maximum uses cannot exceed total maximum uses', 'Validation Error');
      return false;
    }

    return true;
  }

  // Submit handlers
  onSave() {
    if (!this.validateForm()) return;

    const validKeys = Object.keys(DEFAULT_FORM) as (keyof CouponFormData)[];
    const sanitized = sanitizeFormData<CouponFormData>(this.couponData, validKeys);

    // Convert empty arrays to undefined to apply to all
    if (sanitized.applicableProducts?.length === 0) {
      delete sanitized.applicableProducts;
    }
    if (sanitized.applicableCombos?.length === 0) {
      delete sanitized.applicableCombos;
    }

    const obs =
      this.isEditMode && this.couponId
        ? this.couponService.update(this.couponId, sanitized)
        : this.couponService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Coupon updated successfully!' : 'Coupon created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/coupon');
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
}
