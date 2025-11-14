import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ButtonComponent } from '../../../ui/button/button.component';
// Import chính xác các model
import {
  OrderItem,
  OrderPayment,
  OrderShipping,
  Order,
  OrderStatus, // Thêm các type
  PaymentMethod,
  PaymentStatus,
  ShippingStatus,
} from '../../../../models/order.model';
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
  shipping?: OrderShipping | null; // Cho phép null
  status: OrderStatus;
  note: string;
}

// Form mặc định, đã cập nhật
const DEFAULT_FORM: OrderFormData = {
  profile: null,
  profileType: null,
  orderType: 'TakeAway',
  channel: 'AdminPanel',
  items: [],
  totalAmount: 0,
  discountAmount: 0,
  shippingFee: 0,
  grandTotal: 0,
  payment: {
    method: 'cash' as PaymentMethod,
    status: 'pending' as PaymentStatus,
  },
  shipping: null, // Mặc định là null
  status: 'pending' as OrderStatus,
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

  // Map này dùng để điều khiển UI (radio button)
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
    public router: Router,
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
      next: (data: Order) => {
        // Ép kiểu data về OrderFormData (hoặc any nếu cần)
        this.orderData = { ...DEFAULT_FORM, ...(data as any) };
        this.itemTypes.clear();

        // SỬA: Dùng itemType từ model
        this.orderData.items.forEach((item, index) => {
          this.itemTypes.set(index, item.itemType === 'Combo' ? 'combo' : 'product');
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
      next: (data: any) => {
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
        // SỬA: Gán đúng vào address
        this.orderData.shipping!.address = {
          ...defaultAddress,
          recipientName: defaultAddress.recipientName || customer?.name || '',
          recipientPhone: defaultAddress.recipientPhone || customer?.phones?.[0]?.value || '',
        };
        this.toastr.info(`Default shipping address for ${customer?.name} has been auto-filled.`);
      }
    }
  }

  onOrderTypeChange(type: 'TakeAway' | 'DineIn' | 'Delivery') {
    this.orderData.orderType = type;
    if (type === 'Delivery') {
      this.ensureShippingExists();
    } else {
      this.orderData.shipping = null; // SỬA: Gán về null
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
        status: 'pending' as ShippingStatus,
      };
    }
  }

  // --- Quản lý Order Items ---

  addOrderItem() {
    // SỬA: Tạo OrderItem mới theo đúng model
    const newItem: OrderItem = {
      item: '', // Sẽ là ID của product/combo
      itemType: 'Product', // Mặc định là product
      name: '', // Sẽ snapshot
      quantity: 1,
      basePrice: 0,
      price: 0,
      options: [],
      comboSelections: [],
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

    // SỬA: Reset item theo model mới
    item.itemType = type === 'product' ? 'Product' : 'Combo';
    item.item = '';
    item.name = '';
    item.basePrice = 0;
    item.price = 0;
    item.quantity = 1;
    item.options = [];
    item.comboSelections = [];
  }

  onProductChange(index: number, productId: string) {
    const product = this.products.find((p) => p.id === productId);
    if (product) {
      const item = this.orderData.items[index];
      // SỬA: Gán vào item và itemType
      item.item = productId;
      item.itemType = 'Product';
      item.name = product.name;
      const price = (product as any).basePrice || (product as any).price; // Chỉnh lại key giá nếu cần
      item.basePrice = price;
      item.price = price;
      item.comboSelections = []; // Xóa lựa chọn combo (nếu có)
      this.calculateTotals();
    }
  }

  onComboChange(index: number, comboId: string) {
    const combo = this.combos.find((c) => c.id === comboId);
    if (combo) {
      const item = this.orderData.items[index];
      // SỬA: Gán vào item và itemType
      item.item = comboId;
      item.itemType = 'Combo';
      item.name = combo.name;
      const price = (combo as any).comboPrice || (combo as any).price; // Chỉnh lại key giá nếu cần
      item.basePrice = price;
      item.price = price;
      item.options = []; // Xóa tùy chọn (nếu có)
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
      // SỬA: Kiểm tra item.item
      if (!item.item) {
        this.toastr.error(`Item ${i + 1}: Please select a product or combo`, 'Validation Error');
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

    if (sanitized.profile) {
      sanitized.profileType = 'Customer';
    } else {
      sanitized.profileType = null;
    }

    // SỬA: Xóa bỏ logic set item.product/item.combo = null vì không còn cần thiết
    // (Model đã đúng cấu trúc)

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
