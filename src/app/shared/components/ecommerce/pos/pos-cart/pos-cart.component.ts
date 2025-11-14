import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '@ngneat/dialog';

import { PosCustomerModalComponent } from '../pos-customer-modal/pos-customer-modal.component';
import { Customer } from '../../../../models/customer.model';
import { CustomerService } from '../../../../services/api/customer.service';
import { PosStateService } from '../../../../services/api/pos.service';
import { ButtonComponent } from '../../../ui/button/button.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { Order, OrderItemOption } from '../../../../models/order.model'; // SỬA: Import Order

@Component({
  selector: 'app-pos-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PosCustomerModalComponent,
    ButtonComponent,
    TextAreaComponent,
  ],
  templateUrl: './pos-cart.component.html',
})
export class PosCartComponent implements OnInit {
  public posState = inject(PosStateService);
  private customerService = inject(CustomerService);
  private dialogService = inject(DialogService);

  iconRemove = `<svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>`;

  cart$ = this.posState.cartState$;
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  ngOnInit() {
    this.customerService.getAll({ limit: 1000 }).subscribe((res: any) => {
      this.customers = res.data || res.results || [];
      // SỬA: Kích hoạt kiểm tra khách hàng sau khi đã tải xong
      this.checkSelectedCustomer(this.posState.getCurrentCart().profile);
    });

    this.cart$.subscribe((cart) => {
      // SỬA: Lắng nghe 'profile' thay vì 'customer'
      this.checkSelectedCustomer(cart.profile);
    });
  }

  // SỬA: Tách logic kiểm tra khách hàng
  checkSelectedCustomer(profileId: string | null) {
    if (profileId) {
      this.selectedCustomer = this.customers.find((c) => c.id === profileId) || null;
    } else {
      this.selectedCustomer = null;
    }
  }

  openCustomerModal() {
    const dialogRef = this.dialogService.open(PosCustomerModalComponent, {
      size: 'lg',
      data: {
        customers: this.customers,
      },
    });

    dialogRef.afterClosed$.subscribe((customer: Customer) => {
      if (customer) {
        this.posState.setCustomer(customer);
        if (!this.customers.find((c) => c.id === customer.id)) {
          this.customers.push(customer);
        }
      }
    });
  }

  onClearCustomer() {
    this.posState.setCustomer(null);
  }

  // SỬA: Đổi tên tham số 'id' -> 'itemId'
  onQuantityChange(itemId: string, event: Event) {
    const newQuantity = (event.target as HTMLInputElement).valueAsNumber;
    this.posState.updateQuantity(itemId, newQuantity || 0);
  }

  // SỬA: Đổi tên tham số 'id' -> 'itemId'
  onRemoveItem(itemId: string) {
    this.posState.removeItem(itemId);
  }

  // SỬA: Thêm type cho 'type'
  onOrderTypeChange(type: Order['orderType']) {
    this.posState.setOrderType(type);
  }

  public getOptionsString(options: OrderItemOption[]): string {
    if (!options || options.length === 0) {
      return '';
    }
    return options.map((o) => o.optionName).join(', ');
  }
}
