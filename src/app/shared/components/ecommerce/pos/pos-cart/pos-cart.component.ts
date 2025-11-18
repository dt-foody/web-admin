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
import { Order, OrderItemOption } from '../../../../models/order.model';

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

  iconRemove = `<svg xmlns="http://www.w3.org/2000/svg" class="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`;

  cart$ = this.posState.cartState$;
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  ngOnInit() {
    this.customerService.getAll({ limit: 1000 }).subscribe((res: any) => {
      this.customers = res.data || res.results || [];
      this.checkSelectedCustomer(this.posState.getCurrentCart().profile);
    });

    this.cart$.subscribe((cart) => {
      this.checkSelectedCustomer(cart.profile);
    });
  }

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
      data: { customers: this.customers },
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

  // SỬA: Truyền item object (any để lấy tempId)
  onQuantityChange(item: any, event: Event) {
    let newQuantity = (event.target as HTMLInputElement).valueAsNumber;
    if (newQuantity < 1 || isNaN(newQuantity)) {
      newQuantity = 1;
      (event.target as HTMLInputElement).value = '1';
    }
    // Dùng tempId nếu có, fallback về id thường (nếu dữ liệu cũ)
    const idToUpdate = item.tempId || item.item;
    this.posState.updateQuantity(idToUpdate, newQuantity);
  }

  // SỬA: Truyền item object
  onDecreaseQuantity(item: any) {
    if (item.quantity > 1) {
      const idToUpdate = item.tempId || item.item;
      this.posState.updateQuantity(idToUpdate, item.quantity - 1);
    }
  }

  // SỬA: Truyền item object
  onIncreaseQuantity(item: any) {
    const idToUpdate = item.tempId || item.item;
    this.posState.updateQuantity(idToUpdate, item.quantity + 1);
  }

  // SỬA: Truyền item object để lấy tempId
  onRemoveItem(item: any) {
    const idToRemove = item.tempId || item.item;
    this.posState.removeItem(idToRemove);
  }

  onOrderTypeChange(type: Order['orderType']) {
    this.posState.setOrderType(type);
  }

  public getOptionsString(options: OrderItemOption[]): string {
    if (!options || !Array.isArray(options) || options.length === 0) {
      return '';
    }
    return options.map((o) => o.optionName).join(', ');
  }
}
