import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { OrderItem, OrderPayment, OrderShipping } from '../../../../models/order.model';
import { Product } from '../../../../models/product.model';
import { Combo } from '../../../../models/combo.model';
import { Customer } from '../../../../models/customer.model';
import { OrderService } from '../../../../services/api/order.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { CustomerService } from '../../../../services/api/customer.service';
import { ToastrService } from 'ngx-toastr';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { sanitizeFormData, createFormData, deepSanitize } from '../../../../utils/form-data.utils';

interface OrderFormData {
  customer: string | null;
  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  payment: OrderPayment;
  shipping: OrderShipping;
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'canceled';
  note: string;
}

interface ItemTypeOption {
  value: 'product' | 'combo';
  label: string;
}

const DEFAULT_FORM: OrderFormData = {
  customer: null,
  items: [
    {
      product: '',
      name: '',
      quantity: 1,
      price: 0,
      note: '',
      combo: '',
    },
  ],
  totalAmount: 0,
  discountAmount: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash',
    status: 'pending',
  },
  shipping: {
    address: {
      recipientName: '',
      recipientPhone: '',
      street: '',
      ward: '',
      district: '',
      city: '',
    },
    status: 'pending',
  },
  status: 'pending',
  note: '',
};

@Component({
  selector: 'app-order-add',
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    RouterModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './order-add.component.html',
  styles: ``,
})
export class OrderAddComponent implements OnInit {
  orderId: string | null = null;
  isEditMode: boolean = false;

  // Form data
  orderData = createFormData(DEFAULT_FORM);

  // Dropdown options
  customers: Customer[] = [];
  products: Product[] = [];
  combos: Combo[] = [];

  // Track item types for UI
  itemTypes: Map<number, 'product' | 'combo'> = new Map();

  itemTypeOptions: ItemTypeOption[] = [
    { value: 'product', label: 'Product' },
    { value: 'combo', label: 'Combo' },
  ];

  paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'momo', label: 'MoMo' },
    { value: 'vnpay', label: 'VNPay' },
  ];

  paymentStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'failed', label: 'Failed' },
  ];

  shippingStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'delivering', label: 'Delivering' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
  ];

  orderStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'delivering', label: 'Delivering' },
    { value: 'completed', label: 'Completed' },
    { value: 'canceled', label: 'Canceled' },
  ];

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private comboService: ComboService,
    private customerService: CustomerService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.orderData.items = [];

    this.loadCustomers();
    this.loadProducts();
    this.loadCombos();

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.orderId = id;
        this.loadOrder(id);
      }
    });
  }

  loadOrder(id: string) {
    this.orderService.getById(id).subscribe({
      next: (data: any) => {
        this.orderData = { ...data };
        // Set item types based on existing data
        this.orderData.items.forEach((item, index) => {
          if (item.combo) {
            this.itemTypes.set(index, 'combo');
          } else {
            this.itemTypes.set(index, 'product');
          }
        });
        this.calculateTotals();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load order data', 'Error');
      },
    });
  }

  loadCustomers() {
    this.customerService.getAll({ limit: 1000 }).subscribe({
      next: (data) => {
        if (data?.results?.length) {
          this.customers = data.results;
        }
      },
      error: (err) => console.error(err),
    });
  }

  loadProducts() {
    this.productService.getAll({ limit: 1000 }).subscribe({
      next: (data) => {
        if (data?.results?.length) {
          this.products = data.results;
        }
      },
      error: (err) => console.error(err),
    });
  }

  loadCombos() {
    this.comboService.getAll({ limit: 1000 }).subscribe({
      next: (data) => {
        if (data?.results?.length) {
          this.combos = data.results;
        }
      },
      error: (err) => console.error(err),
    });
  }

  // Order Items Management
  addOrderItem() {
    const newItem: OrderItem = {
      product: '',
      name: '',
      quantity: 1,
      price: 0,
      note: '',
    };
    this.orderData.items.push(newItem);
    // Default to product type
    this.itemTypes.set(this.orderData.items.length - 1, 'product');
  }

  removeOrderItem(index: number) {
    this.orderData.items.splice(index, 1);
    this.itemTypes.delete(index);
    // Re-index the map
    const newMap = new Map<number, 'product' | 'combo'>();
    this.itemTypes.forEach((value, key) => {
      if (key > index) {
        newMap.set(key - 1, value);
      } else if (key < index) {
        newMap.set(key, value);
      }
    });
    this.itemTypes = newMap;
    this.calculateTotals();
  }

  // Get item type for UI
  getItemType(index: number): 'product' | 'combo' {
    return this.itemTypes.get(index) || 'product';
  }

  // Handle item type change
  onItemTypeChange(index: number, type: 'product' | 'combo') {
    this.itemTypes.set(index, type);
    // Reset item data when changing type
    const item = this.orderData.items[index];
    if (type === 'product') {
      item.combo = undefined;
      item.product = '';
    } else {
      item.product = '';
      item.combo = '';
    }
    item.name = '';
    item.price = 0;
    item.quantity = 1;
  }

  // Handle product selection
  onProductChange(index: number, productId: string) {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      this.orderData.items[index].product = productId;
      this.orderData.items[index].name = product.name;
      this.orderData.items[index].price = product.basePrice;
      this.orderData.items[index].combo = undefined; // Clear combo
      this.calculateTotals();
    }
  }

  // Handle combo selection
  onComboChange(index: number, comboId: string) {
    const combo = this.combos.find((c) => c.id === comboId);
    if (combo) {
      this.orderData.items[index].combo = comboId;
      this.orderData.items[index].name = combo.name;
      this.orderData.items[index].price = combo.comboPrice;
      this.orderData.items[index].product = ''; // Clear product
      this.calculateTotals();
    }
  }

  onItemQuantityChange(index: number, quantity: string | number) {
    const qty = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity;
    this.orderData.items[index].quantity = qty;
    this.calculateTotals();
  }

  onItemPriceChange(index: number, price: string | number) {
    const p = typeof price === 'string' ? parseFloat(price) || 0 : price;
    this.orderData.items[index].price = p;
    this.calculateTotals();
  }

  // Calculate totals
  calculateTotals() {
    // Total amount from items
    this.orderData.totalAmount = this.orderData.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
      return sum + price * item.quantity;
    }, 0);

    // Grand total
    const discount =
      typeof this.orderData.discountAmount === 'string'
        ? parseFloat(this.orderData.discountAmount) || 0
        : this.orderData.discountAmount;

    const shipping =
      typeof this.orderData.shippingFee === 'string'
        ? parseFloat(this.orderData.shippingFee) || 0
        : this.orderData.shippingFee;

    this.orderData.grandTotal = this.orderData.totalAmount - discount + shipping;
  }

  // Validation
  validateForm(): boolean {
    if (!this.orderData.customer) {
      this.toastr.error('Please select a customer', 'Validation Error');
      return false;
    }

    if (this.orderData.items.length === 0) {
      this.toastr.error('Please add at least one item', 'Validation Error');
      return false;
    }

    for (let i = 0; i < this.orderData.items.length; i++) {
      const item = this.orderData.items[i];
      const itemType = this.getItemType(i);

      // Check if product or combo is selected based on type
      if (itemType === 'product' && !item.product) {
        this.toastr.error(`Item ${i + 1}: Please select a product`, 'Validation Error');
        return false;
      }
      if (itemType === 'combo' && !item.combo) {
        this.toastr.error(`Item ${i + 1}: Please select a combo`, 'Validation Error');
        return false;
      }
      if (item.quantity <= 0) {
        this.toastr.error(`Item ${i + 1}: Quantity must be greater than 0`, 'Validation Error');
        return false;
      }
    }

    // Validate shipping address
    const addr = this.orderData.shipping.address;
    if (!addr.recipientName || !addr.recipientPhone || !addr.street || !addr.city) {
      this.toastr.error('Please fill in all required shipping information', 'Validation Error');
      return false;
    }

    return true;
  }

  // Submit handlers
  onSaveDraft() {
    this.orderData.status = 'pending';
    this.onSubmit();
  }

  onSubmit() {
    console.log('order status:', this.orderData.status);
    // const validKeys = Object.keys(DEFAULT_FORM) as (keyof OrderFormData)[];
    // const sanitized = sanitizeFormData<OrderFormData>(this.orderData, validKeys);

    const sanitized = deepSanitize(this.orderData, DEFAULT_FORM);

    const obs =
      this.isEditMode && this.orderId
        ? this.orderService.update(this.orderId, sanitized)
        : this.orderService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Order updated successfully!' : 'Order created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/order');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          this.isEditMode ? 'Failed to update order' : 'Failed to create order',
          'Error',
        );
      },
    });
  }
}
