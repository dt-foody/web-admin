import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { CustomerService } from '../../../../services/api/customer.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';
import { CustomerFormData } from '../../../../models/customer.model';
import { NgSelectModule } from '@ng-select/ng-select'; // Import NgSelectModule

// DEFAULT_FORM: emails, phones, addresses là mảng rỗng
const DEFAULT_FORM: CustomerFormData = {
  name: '',
  emails: [],
  phones: [],
  gender: undefined,
  birthDate: '',
  isActive: true,
  addresses: [],
};

@Component({
  selector: 'app-customer-add',
  imports: [
    CommonModule,
    FormsModule,
    LabelComponent,
    InputFieldComponent,
    ButtonComponent,
    NgSelectModule, // Thêm NgSelectModule
  ],
  templateUrl: './customer-add.component.html',
})
export class CustomerAddComponent implements OnInit {
  customerId: string | null = null;
  isEditMode: boolean = false;

  customerData = createFormData(DEFAULT_FORM);

  genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  contactOptions = [
    { value: 'Home', label: 'Home' },
    { value: 'Company', label: 'Company' },
    { value: 'Other', label: 'Other' },
  ];

  expandedAddresses: Set<number> = new Set();

  constructor(
    private customerService: CustomerService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.customerData.emails = [];
    this.customerData.phones = [];
    this.customerData.addresses = [];

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.customerId = id;
        this.loadCustomer(id);
      } else {
        // Không thêm email/phone mặc định khi tạo mới
      }
    });
  }

  loadCustomer(id: string) {
    this.customerService.getById(id).subscribe({
      next: (data: any) => {
        this.customerData = {
          ...DEFAULT_FORM,
          ...data,
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
          emails: data.emails || [],
          phones: data.phones || [],
          addresses: data.addresses || [],
        };
        // Không tự động thêm email/phone nếu mảng rỗng
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load customer data', 'Error');
      },
    });
  }

  // --- Quản lý Email ---
  addEmail() {
    this.customerData.emails.push({
      type: 'Other',
      value: '',
    });
  }

  removeEmail(index: number) {
    // Cho phép xóa mục cuối cùng
    this.customerData.emails.splice(index, 1);
  }

  // --- Quản lý Phone ---
  addPhone() {
    this.customerData.phones.push({
      type: 'Other',
      value: '',
    });
  }

  removePhone(index: number) {
    // Cho phép xóa mục cuối cùng
    this.customerData.phones.splice(index, 1);
  }

  // --- Address management ---
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
      [this.customerData.addresses[index], this.customerData.addresses[index - 1]] = [
        this.customerData.addresses[index - 1],
        this.customerData.addresses[index],
      ];
    }
  }

  moveAddressDown(index: number) {
    if (index < this.customerData.addresses.length - 1) {
      [this.customerData.addresses[index], this.customerData.addresses[index + 1]] = [
        this.customerData.addresses[index + 1],
        this.customerData.addresses[index],
      ];
    }
  }

  handleSelectChange(field: keyof CustomerFormData, value: string) {
    if (field === 'isActive') {
      this.customerData[field] = value === 'true';
    } else {
      (this.customerData as any)[field] = value || undefined;
    }
  }

  // --- Validate form ---
  validateForm(): boolean {
    // 1. Tên là bắt buộc
    if (!this.customerData.name.trim()) {
      this.toastr.error('Full name is required', 'Validation');
      return false;
    }

    // 2. Email là tùy chọn, nhưng nếu nhập thì phải đúng định dạng
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < this.customerData.emails.length; i++) {
      const emailVal = this.customerData.emails[i].value.trim();
      if (emailVal && !emailRegex.test(emailVal)) {
        this.toastr.error(`Email ${i + 1}: Invalid email format`, 'Validation');
        return false;
      }
    }

    // 3. Phone là tùy chọn
    // (Không có validation)

    // 4. Địa chỉ là tùy chọn, nhưng nếu thêm thì phải điền đủ trường bắt buộc
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

  // --- Submit handlers ---
  onSave() {
    if (!this.validateForm()) return;

    // Sanitize: Xóa các trường rỗng (như email, phone nếu người dùng chỉ nhập khoảng trắng)
    const sanitizedData = deepSanitize(this.customerData, DEFAULT_FORM);

    // Lọc ra các email/phone rỗng mà người dùng có thể đã thêm nhưng không nhập
    sanitizedData.emails = sanitizedData.emails.filter((e) => e.value.trim());
    sanitizedData.phones = sanitizedData.phones.filter((p) => p.value.trim());

    const obs =
      this.isEditMode && this.customerId
        ? this.customerService.update(this.customerId, sanitizedData)
        : this.customerService.create(sanitizedData);

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
