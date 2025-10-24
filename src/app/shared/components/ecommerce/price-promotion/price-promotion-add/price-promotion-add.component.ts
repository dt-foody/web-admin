import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { PricePromotionFormData } from '../../../../models/price-promotion.model';
import { PricePromotionService } from '../../../../services/api/price-promotion.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sanitizeFormData, createFormData } from '../../../../utils/form-data.utils';
import { SwitchComponent } from '../../../form/input/switch.component';

const DEFAULT_FORM: PricePromotionFormData = {
  name: '',
  description: '',
  product: null,
  combo: null,
  discountType: 'percentage',
  discountValue: 0,
  startDate: '',
  endDate: '',
  maxQuantity: 0,
  dailyMaxUses: 0,
  isActive: true,
};

@Component({
  selector: 'app-price-promotion-add',
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
  ],
  templateUrl: './price-promotion-add.component.html',
  styles: ``,
})
export class PricePromotionAddComponent implements OnInit {
  promotionId: string | null = null;
  isEditMode: boolean = false;

  // Form data
  promotionData = createFormData(DEFAULT_FORM);

  // Dropdown options
  products: any[] = [];
  combos: any[] = [];

  discountTypeOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount' },
  ];

  applicableToOptions = [
    { value: 'product', label: 'Product' },
    { value: 'combo', label: 'Combo' },
  ];

  selectedApplicableTo: 'product' | 'combo' = 'product';

  constructor(
    private pricePromotionService: PricePromotionService,
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
        this.promotionId = id;
        this.loadPromotion(id);
      } else {
        // Set default dates for new promotion
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Default 30 days validity

        this.promotionData.startDate = this.formatDateTimeLocal(now);
        this.promotionData.endDate = this.formatDateTimeLocal(endDate);
      }
    });
  }

  loadPromotion(id: string) {
    this.pricePromotionService.getById(id).subscribe({
      next: (data: any) => {
        this.promotionData = {
          ...data,
          startDate: this.formatDateTimeLocal(new Date(data.startDate)),
          endDate: this.formatDateTimeLocal(new Date(data.endDate)),
          product: data.product?.id || data.product || null,
          combo: data.combo?.id || data.combo || null,
        };

        // Determine applicable type
        if (this.promotionData.product) {
          this.selectedApplicableTo = 'product';
        } else if (this.promotionData.combo) {
          this.selectedApplicableTo = 'combo';
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load promotion data', 'Error');
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

  // Handle applicable type change
  handleApplicableToChange(value: string) {
    this.selectedApplicableTo = value as 'product' | 'combo';

    // Clear both fields
    this.promotionData.product = null;
    this.promotionData.combo = null;
  }

  handleSelectChange(field: keyof PricePromotionFormData, value: string) {
    if (field === 'isActive') {
      this.promotionData[field] = value === 'true';
    } else {
      (this.promotionData as any)[field] = value;
    }
  }

  // Validate form
  validateForm(): boolean {
    if (!this.promotionData.name.trim()) {
      this.toastr.error('Promotion name is required', 'Validation Error');
      return false;
    }

    // Check if either product or combo is selected
    if (!this.promotionData.product && !this.promotionData.combo) {
      this.toastr.error('Please select either a product or combo', 'Validation Error');
      return false;
    }

    // Check if both are selected (should only select one)
    if (this.promotionData.product && this.promotionData.combo) {
      this.toastr.error('Please select only one: either product or combo', 'Validation Error');
      return false;
    }

    if (this.promotionData.discountValue <= 0) {
      this.toastr.error('Discount value must be greater than 0', 'Validation Error');
      return false;
    }

    if (
      this.promotionData.discountType === 'percentage' &&
      this.promotionData.discountValue > 100
    ) {
      this.toastr.error('Percentage discount cannot exceed 100%', 'Validation Error');
      return false;
    }

    if (!this.promotionData.startDate || !this.promotionData.endDate) {
      this.toastr.error('Start date and end date are required', 'Validation Error');
      return false;
    }

    const startDate = new Date(this.promotionData.startDate);
    const endDate = new Date(this.promotionData.endDate);

    if (endDate <= startDate) {
      this.toastr.error('End date must be after start date', 'Validation Error');
      return false;
    }

    if (this.promotionData.maxQuantity < 0) {
      this.toastr.error('Maximum quantity cannot be negative', 'Validation Error');
      return false;
    }

    if (this.promotionData.dailyMaxUses < 0) {
      this.toastr.error('Daily maximum uses cannot be negative', 'Validation Error');
      return false;
    }

    if (
      this.promotionData.maxQuantity > 0 &&
      this.promotionData.dailyMaxUses > this.promotionData.maxQuantity
    ) {
      this.toastr.error(
        'Daily maximum uses cannot exceed total maximum quantity',
        'Validation Error',
      );
      return false;
    }

    return true;
  }

  // Submit handlers
  onSave() {
    if (!this.validateForm()) return;

    const validKeys = Object.keys(DEFAULT_FORM) as (keyof PricePromotionFormData)[];
    const sanitized = sanitizeFormData<PricePromotionFormData>(this.promotionData, validKeys);

    // Ensure only one of product/combo is set
    if (this.selectedApplicableTo === 'product') {
      delete sanitized.combo;
    } else {
      delete sanitized.product;
    }

    const obs =
      this.isEditMode && this.promotionId
        ? this.pricePromotionService.update(this.promotionId, sanitized)
        : this.pricePromotionService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Promotion updated successfully!' : 'Promotion created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/price-promotion');
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
    this.router.navigateByUrl('/price-promotion');
  }
}
