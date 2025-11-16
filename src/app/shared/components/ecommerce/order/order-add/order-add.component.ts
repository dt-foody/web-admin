import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import {
  OrderItem,
  OrderPayment,
  OrderShipping,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingStatus,
  OrderShippingAddress,
  OrderItemOption,
  OrderItemComboSelection,
} from '../../../../models/order.model';
import { Product, ProductOptionGroup, ProductOption } from '../../../../models/product.model';
import { Combo, ComboItem, ComboPricingMode, DiscountType } from '../../../../models/combo.model';
import { Customer } from '../../../../models/customer.model';
import { OrderService } from '../../../../services/api/order.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { CustomerService } from '../../../../services/api/customer.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';

// Interface cho form data
interface OrderFormData {
  profile: string | null;
  profileType: 'Customer' | 'Employee' | null;
  orderType: 'TakeAway' | 'DineIn' | 'Delivery';
  channel: 'AdminPanel' | 'POS' | 'WebApp' | 'MobileApp' | 'Grab';

  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  grandTotal: number;
  payment: OrderPayment;
  shipping?: OrderShipping | null;
  status: OrderStatus;
  note: string;

  // Trường quản lý UI cho discount
  discountType: 'fixed' | 'percentage';
  discountValue: number;
}

const DEFAULT_SHIPPING_ADDRESS: OrderShippingAddress = {
  recipientName: '',
  recipientPhone: '',
  street: '',
  ward: '',
  district: '',
  city: '',
};

const DEFAULT_FORM: OrderFormData = {
  profile: null,
  profileType: null,
  orderType: 'TakeAway',
  channel: 'AdminPanel',
  items: [],
  totalAmount: 0,
  discountType: 'fixed',
  discountValue: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash' as PaymentMethod,
    status: 'pending' as PaymentStatus,
  },
  shipping: null,
  status: 'pending' as OrderStatus,
  note: '',
};

@Component({
  selector: 'app-order-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    RouterModule,
    LabelComponent,
    InputFieldComponent,
    ButtonComponent,
  ],
  templateUrl: './order-add.component.html',
})
export class OrderAddComponent implements OnInit {
  ngOnInit(): void {
    console.log('123');
  }
}
