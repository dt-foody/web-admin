import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Customer } from '../../../../models/customer.model';
import { CustomerService } from '../../../../services/api/customer.service';
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
  selector: 'app-customer-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    CheckboxComponent,
    HasPermissionDirective,
  ],
  templateUrl: './customer-list.component.html',
  styles: ``,
})
export class CustomerListComponent extends BaseListComponent<Customer> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;

  itemToDelete: Customer | null = null;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('CustomerListComponent init logic');
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.name = this.query.search.trim();
    }

    this.customerService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;
    });
  }

  getGenderLabel(gender?: string): string {
    const labels: any = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
    };
    return gender ? labels[gender] || '-' : '-';
  }

  getGenderBadgeClass(gender?: string): string {
    const classes: any = {
      male: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      female: 'bg-pink-50 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400',
      other: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400',
    };
    return gender
      ? classes[gender] || 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400'
      : 'bg-gray-50 dark:bg-gray-500/15 text-gray-700 dark:text-gray-400';
  }

  getDefaultAddress(customer: Customer): string {
    const defaultAddr = customer.addresses?.find((addr) => addr.isDefault);
    if (defaultAddr) {
      return `${defaultAddr.street}, ${defaultAddr.ward}, ${defaultAddr.district}, ${defaultAddr.city}`;
    }
    return customer.addresses && customer.addresses.length > 0
      ? `${customer.addresses[0].street}, ${customer.addresses[0].ward}, ${customer.addresses[0].district}, ${customer.addresses[0].city}`
      : '-';
  }

  getAddressCount(customer: Customer): number {
    return customer.addresses?.length || 0;
  }

  handleEdit(customer: Customer): void {
    this.router.navigate(['/customer/edit', customer.id]);
  }

  handleDelete(customer: Customer): void {
    this.itemToDelete = customer;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.customerService.delete(this.itemToDelete.id).subscribe({
          next: () => {
            this.toastr.success('Delete successfully!', 'Customer');
            this.fetchData();
          },
          error: (err) => {
            this.toastr.error(err?.error?.message || 'Delete failed!', 'Customer');
          },
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(customer: Customer): void {
    this.customerService.update(customer.id, { isActive: !customer.isActive }).subscribe({
      next: () => {
        customer.isActive = !customer.isActive;
        this.toastr.success('Update successfully!', 'Customer');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Customer');
      },
    });
  }

  handleViewDetail(customer: Customer): void {
    // You can implement view detail modal or navigate to detail page
    this.router.navigate(['/customer/detail', customer.id]);
  }
}
