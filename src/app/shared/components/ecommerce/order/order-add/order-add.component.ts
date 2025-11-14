import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { OrderItem, OrderPayment, OrderShipping, Order } from '../../../../models/order.model';
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
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';

// Interface cho form data, đã cập nhật
interface OrderFormData {
  profile: string | null;
  profileType: 'Customer' | 'Employee' | null;
  orderType: 'TakeAway' | 'DineIn' | 'Delivery';
  channel: 'AdminPanel' | 'POS' | 'WebApp' | 'MobileApp' | 'Grab';

  items: OrderItem[];
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  payment: OrderPayment;
  shipping?: OrderShipping; // Shipping là tùy chọn
  status: 'pending' | 'confirmed' | 'preparing' | 'delivering' | 'completed' | 'canceled';
  note: string;
}

// Form mặc định, đã cập nhật
const DEFAULT_FORM: OrderFormData = {
  profile: null, // Khách vãng lai là mặc định
  profileType: null,
  orderType: 'TakeAway', // Mặc định là mang đi
  channel: 'AdminPanel', // Mặc định là tạo từ admin
  items: [], // Mặc định là rỗng
  totalAmount: 0,
  discountAmount: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash',
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
    ButtonComponent,
  ],
  templateUrl: './order-add.component.html',
})
export class OrderAddComponent implements OnInit {
  orderId: string | null = null;
  isEditMode: boolean = false;
  orderData = createFormData(DEFAULT_FORM);

  // Data
  customers: Customer[] = [];
  products: Product[] = [];
  combos: Combo[] = [];

  itemTypes: Map<number, 'product' | 'combo'> = new Map();

  // Options
  orderTypeOptions = [
    { value: 'TakeAway', label: 'Take Away' },
    { value: 'DineIn', label: 'Dine In (At Store)' },
    { value: 'Delivery', label: 'Delivery' },
  ];
  channelOptions = [
    { value: 'AdminPanel', label: 'Admin Panel' },
    { value: 'POS', label: 'POS (At Store)' },
    { value: 'WebApp', label: 'Web App' },
    { value: 'MobileApp', label: 'Mobile App' },
    { value: 'Grab', label: 'Grab/ShopeeFood' },
  ];
  itemTypeOptions = [
    { value: 'product', label: 'Product' },
    { value: 'combo', label: 'Combo' },
  ];
  paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'momo', label: 'MoMo' },
    { value: 'vnpay', label: 'VNPay' },
    { value: 'payos', label: 'PayOS' },
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
    public router: Router, // public để HTML có thể gọi
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
        this.orderData = { ...DEFAULT_FORM, ...data };
        this.itemTypes.clear();
        this.orderData.items.forEach((item, index) => {
          this.itemTypes.set(index, item.combo ? 'combo' : 'product');
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
      // Sửa lại nếu service khác
      next: (data: any) => {
        // Giả sử data trả về có .data hoặc .results
        this.customers = data.data || data.results || [];
      },
      error: (err) => console.error(err),
    });
  }

  loadProducts() {
    this.productService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.products = data.data || data.results || [];
      },
      error: (err) => console.error(err),
    });
  }

  loadCombos() {
    this.comboService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.combos = data.data || data.results || [];
      },
      error: (err) => console.error(err),
    });
  }

  // --- Xử lý Logic Form ---

  onCustomerChange(customerId: string) {
    if (!customerId) {
      this.orderData.profile = null;
      this.orderData.profileType = null;
      return;
    }

    this.orderData.profile = customerId;
    this.orderData.profileType = 'Customer';

    if (this.orderData.orderType === 'Delivery') {
      const customer = this.customers.find((c) => c.id === customerId);
      const defaultAddress = customer?.addresses?.find((a) => a.isDefault);

      if (defaultAddress) {
        this.ensureShippingExists();
        this.orderData.shipping!.address = { ...defaultAddress };
        this.toastr.info(`Default shipping address for ${customer?.name} has been auto-filled.`);
      }
    }
  }

  onOrderTypeChange(type: 'TakeAway' | 'DineIn' | 'Delivery') {
    this.orderData.orderType = type;
    if (type === 'Delivery') {
      this.ensureShippingExists();
    } else {
      this.orderData.shipping = undefined;
      this.orderData.shippingFee = 0;
      this.calculateTotals();
    }
  }

  ensureShippingExists() {
    if (!this.orderData.shipping) {
      this.orderData.shipping = {
        address: {
          recipientName: '',
          recipientPhone: '',
          street: '',
          ward: '',
          district: '',
          city: '',
        },
        status: 'pending',
      };
    }
  }

  // --- Quản lý Order Items ---

  addOrderItem() {
    const newItem: OrderItem = {
      product: '',
      name: '',
      quantity: 1,
      price: 0,
      note: '',
    };
    this.orderData.items.push(newItem);
    this.itemTypes.set(this.orderData.items.length - 1, 'product');
  }

  removeOrderItem(index: number) {
    this.orderData.items.splice(index, 1);
    this.itemTypes.delete(index);
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

  getItemType(index: number): 'product' | 'combo' {
    return this.itemTypes.get(index) || 'product';
  }

  onItemTypeChange(index: number, type: 'product' | 'combo') {
    this.itemTypes.set(index, type);
    const item = this.orderData.items[index];
    if (type === 'product') {
      item.combo = undefined;
      item.product = '';
    } else {
      item.product = undefined;
      item.combo = '';
    }
    item.name = '';
    item.price = 0;
    item.quantity = 1;
  }

  onProductChange(index: number, productId: string) {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      this.orderData.items[index].product = productId;
      this.orderData.items[index].name = product.name;
      this.orderData.items[index].price = (product as any).basePrice || (product as any).price; // Chỉnh lại key giá nếu cần
      this.orderData.items[index].combo = undefined;
      this.calculateTotals();
    }
  }

  onComboChange(index: number, comboId: string) {
    const combo = this.combos.find((c) => c.id === comboId);
    if (combo) {
      this.orderData.items[index].combo = comboId;
      this.orderData.items[index].name = combo.name;
      this.orderData.items[index].price = (combo as any).comboPrice || (combo as any).price; // Chỉnh lại key giá nếu cần
      this.orderData.items[index].product = undefined;
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

  // --- Tính toán ---

  calculateTotals() {
    this.orderData.totalAmount = this.orderData.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price;
      return sum + price * item.quantity;
    }, 0);

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

  // --- Validation & Submit ---

  validateForm(): boolean {
    if (this.orderData.items.length === 0) {
      this.toastr.error('Please add at least one item', 'Validation Error');
      return false;
    }

    for (let i = 0; i < this.orderData.items.length; i++) {
      const item = this.orderData.items[i];
      const itemType = this.getItemType(i);
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

    if (this.orderData.orderType === 'Delivery') {
      if (!this.orderData.shipping) {
        this.toastr.error(
          'Shipping information is missing for a delivery order',
          'Validation Error',
        );
        return false;
      }
      const addr = this.orderData.shipping.address;
      if (!addr.recipientName || !addr.recipientPhone || !addr.street || !addr.city) {
        this.toastr.error(
          'Please fill in all required shipping fields for delivery',
          'Validation Error',
        );
        return false;
      }
    }
    return true;
  }

  onSaveDraft() {
    this.orderData.status = 'pending';
    this.onSubmit();
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    const sanitized: any = deepSanitize(this.orderData, DEFAULT_FORM);

    // Đảm bảo profileType được gửi
    if (sanitized.profile) {
      sanitized.profileType = 'Customer';
    } else {
      sanitized.profileType = null;
    }

    // Đảm bảo item.product và item.combo không cùng tồn tại
    sanitized.items.forEach((item: any, index: number) => {
      if (this.getItemType(index) === 'product') {
        item.combo = null;
      } else {
        item.product = null;
      }
    });

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
          err?.error?.message ||
            (this.isEditMode ? 'Failed to update order' : 'Failed to create order'),
          'Error',
        );
      },
    });
  }
}
