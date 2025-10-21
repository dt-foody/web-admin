import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { CustomerService } from '../../../../services/api/customer.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: any;
  isActive: boolean;
  addresses: {
    label: string;
    recipientName: string;
    recipientPhone: string;
    street: string;
    ward: string;
    district: string;
    city: string;
    isDefault?: boolean;
  }[];
}

const DEFAULT_FORM: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  gender: undefined,
  birthDate: '',
  isActive: true,
  addresses: [
    {
      label: '',
      recipientName: '',
      recipientPhone: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      isDefault: false,
    },
  ],
};

@Component({
  selector: 'app-customer-add',
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './customer-add.component.html',
  styles: ``,
})
export class CustomerAddComponent implements OnInit {
  customerId: string | null = null;
  isEditMode: boolean = false;

  // Form data
  customerData = createFormData(DEFAULT_FORM);

  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  // UI state
  expandedAddresses: Set<number> = new Set();

  constructor(
    private customerService: CustomerService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.customerData.addresses = [];
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.customerId = id;
        this.loadCustomer(id);
      }
    });
  }

  loadCustomer(id: string) {
    this.customerService.getById(id).subscribe({
      next: (data: any) => {
        this.customerData = {
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
        };
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load customer data', 'Error');
      },
    });
  }

  // Address management
  toggleAddress(index: number) {
    if (this.expandedAddresses.has(index)) {
      this.expandedAddresses.delete(index);
    } else {
      this.expandedAddresses.add(index);
    }
  }

  isAddressExpanded(index: number): boolean {
    return this.expandedAddresses.has(index);
  }

  addAddress() {
    this.customerData.addresses.push({
      label: '',
      recipientName: '',
      recipientPhone: '',
      street: '',
      ward: '',
      district: '',
      city: '',
      isDefault: this.customerData.addresses.length === 0,
    });
    this.expandedAddresses.add(this.customerData.addresses.length - 1);
  }

  removeAddress(index: number) {
    const wasDefault = this.customerData.addresses[index].isDefault;
    this.customerData.addresses.splice(index, 1);
    this.expandedAddresses.delete(index);

    // If removed address was default, set first address as default
    if (wasDefault && this.customerData.addresses.length > 0) {
      this.customerData.addresses[0].isDefault = true;
    }
  }

  setDefaultAddress(index: number) {
    this.customerData.addresses.forEach((addr, idx) => {
      addr.isDefault = idx === index;
    });
  }

  moveAddressUp(index: number) {
    if (index > 0) {
      const temp = this.customerData.addresses[index];
      this.customerData.addresses[index] = this.customerData.addresses[index - 1];
      this.customerData.addresses[index - 1] = temp;
    }
  }

  moveAddressDown(index: number) {
    if (index < this.customerData.addresses.length - 1) {
      const temp = this.customerData.addresses[index];
      this.customerData.addresses[index] = this.customerData.addresses[index + 1];
      this.customerData.addresses[index + 1] = temp;
    }
  }

  handleSelectChange(field: keyof CustomerFormData, value: string) {
    if (field === 'isActive') {
      this.customerData[field] = value === 'true';
    } else {
      (this.customerData as any)[field] = value || undefined;
    }
  }

  // Validate form
  validateForm(): boolean {
    if (!this.customerData.name.trim()) {
      this.toastr.error('Full name is required', 'Validation');
      return false;
    }

    if (!this.customerData.email.trim()) {
      this.toastr.error('Email is required', 'Validation');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.customerData.email)) {
      this.toastr.error('Invalid email format', 'Validation');
      return false;
    }

    if (!this.customerData.phone.trim()) {
      this.toastr.error('Phone number is required', 'Validation');
      return false;
    }

    // Validate addresses
    for (let i = 0; i < this.customerData.addresses.length; i++) {
      const addr = this.customerData.addresses[i];
      if (!addr.recipientName.trim()) {
        this.toastr.error(`Address ${i + 1}: Recipient name is required`, 'Validation');
        return false;
      }
      if (!addr.recipientPhone.trim()) {
        this.toastr.error(`Address ${i + 1}: Recipient phone is required`, 'Validation');
        return false;
      }
      if (!addr.street.trim() || !addr.ward.trim() || !addr.district.trim() || !addr.city.trim()) {
        this.toastr.error(`Address ${i + 1}: All address fields are required`, 'Validation');
        return false;
      }
    }

    return true;
  }

  // Submit handlers
  onSave() {
    if (!this.validateForm()) return;

    const sanitized = deepSanitize(this.customerData, DEFAULT_FORM);

    const obs =
      this.isEditMode && this.customerId
        ? this.customerService.update(this.customerId, sanitized)
        : this.customerService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Customer updated successfully!' : 'Customer created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/customer');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err?.error?.message || (this.isEditMode ? 'Update failed!' : 'Create failed!'),
          'Error',
        );
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/customer');
  }
}
