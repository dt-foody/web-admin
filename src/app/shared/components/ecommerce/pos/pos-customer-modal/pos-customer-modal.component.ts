// src/app/features/pos/components/pos-customer-modal/pos-customer-modal.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@ngneat/dialog'; // <-- CHỈ CẦN IMPORT DialogRef
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';
import { Customer } from '../../../../models/customer.model';
import { CustomerService } from '../../../../services/api/customer.service';

@Component({
  selector: 'app-pos-customer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './pos-customer-modal.component.html',
})
export class PosCustomerModalComponent implements OnInit {
  // --- SỬA LỖI: Bỏ injectData và injectData ---
  // private data = injectData<{ customers: Customer[] }>(); // <-- XÓA DÒNG NÀY
  // public dialogRef = inject(DialogRef); // <-- XÓA DÒNG NÀY

  customers: Customer[] = [];

  private customerService = inject(CustomerService);
  private toastr = inject(ToastrService);

  activeTab: 'search' | 'create' = 'search';
  selectedCustomerId: string | null = null;

  newCustomer = {
    name: '',
    phone: '',
  };
  isCreating = false;

  // --- THÊM VÀO: Inject DialogRef qua constructor ---
  constructor(public dialogRef: DialogRef<{ customers: Customer[] }>) {
    // Lấy data từ dialogRef
    this.customers = this.dialogRef.data.customers || [];
  }

  ngOnInit() {
    // Không cần làm gì ở đây nữa
    console.log('init');
  }

  onSelectCustomer() {
    if (this.selectedCustomerId) {
      const customer = this.customers.find((c) => c.id === this.selectedCustomerId);
      this.dialogRef.close(customer);
    }
  }

  onCreateCustomer() {
    if (!this.newCustomer.name || !this.newCustomer.phone) {
      this.toastr.error('Vui lòng nhập Tên và SĐT');
      return;
    }
    this.isCreating = true;

    const payload = {
      name: this.newCustomer.name,
      phones: [{ value: this.newCustomer.phone, isPrimary: true, type: 'Other' }],
      emails: [],
      addresses: [],
    };

    this.customerService.create(payload as any).subscribe({
      next: (createdCustomer: any) => {
        this.toastr.success('Tạo khách hàng mới thành công!');
        this.isCreating = false;
        this.dialogRef.close(createdCustomer);
      },
      error: (err) => {
        this.toastr.error(err?.error?.message || 'Lỗi khi tạo khách hàng');
        this.isCreating = false;
      },
    });
  }

  onDismiss() {
    this.dialogRef.close(null);
  }
}
