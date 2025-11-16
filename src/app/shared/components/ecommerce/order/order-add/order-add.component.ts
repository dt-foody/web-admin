import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';

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

import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';

// ---- Form interface ----

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

  // UI discount
  discountType: 'fixed' | 'percentage';
  discountValue: number;
}

// ---- Runtime-extended selection type ----
type ExtendedComboSelection = OrderItemComboSelection & {
  productSnapshot?: Product;
};

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
  orderId: string | null = null;
  isEditMode = false;
  orderData = createFormData(DEFAULT_FORM);

  // Data
  customers: Customer[] = [];
  products: Product[] = [];
  combos: Combo[] = [];

  // UI maps
  itemTypes: Map<number, 'product' | 'combo'> = new Map();
  itemExpandedState: Map<number, boolean> = new Map();

  // Customer / shipping
  selectedCustomer: Customer | null = null;
  selectedShippingAddressId = 'new';
  shippingAddressOptions: { id: string; label: string }[] = [];

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

  discountTypeOptions = [
    { value: 'fixed', label: 'Fixed Amount (đ)' },
    { value: 'percentage', label: 'Percentage (%)' },
  ];

  // Enum for template
  PricingMode = ComboPricingMode;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private comboService: ComboService,
    private customerService: CustomerService,
    private toastr: ToastrService,
    public router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  // ----------------- Init -----------------

  ngOnInit(): void {
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

  // ----------------- Load data -----------------

  loadOrder(id: string): void {
    this.orderService.getById(id).subscribe({
      next: (data: Order) => {
        // Merge với default để tránh thiếu field
        this.orderData = {
          ...DEFAULT_FORM,
          ...(data as any),
        };

        // Discount UI
        this.orderData.discountType = 'fixed';
        this.orderData.discountValue = (data as any).discountAmount || 0;

        // Customer
        if (data.profile && data.profileType === 'Customer') {
          const customerId = (data.profile as any).id || (data.profile as any);
          this.orderData.profile = customerId;
          this.loadFullCustomer(customerId);
        }

        // Map UI type + expanded state
        this.itemTypes.clear();
        this.itemExpandedState.clear();
        this.orderData.items.forEach((item, index) => {
          const type: 'product' | 'combo' = item.itemType === 'Combo' ? 'combo' : 'product';
          this.itemTypes.set(index, type);
          this.itemExpandedState.set(index, false);
        });

        this.calculateTotals();
      },
      error: () => this.toastr.error('Cannot load order data', 'Error'),
    });
  }

  loadFullCustomer(customerId: string): void {
    const customer = this.customers.find((c) => c.id === customerId);
    if (customer) {
      this.selectedCustomer = customer;
      this.buildShippingAddressOptions();
      this.selectedShippingAddressId = 'new';
      return;
    }

    this.customerService.getById(customerId).subscribe((cust) => {
      this.selectedCustomer = cust;
      this.buildShippingAddressOptions();
      this.selectedShippingAddressId = 'new';
    });
  }

  loadCustomers(): void {
    this.customerService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.customers = data.data || data.results || [];
        if (this.isEditMode && this.orderData.profile) {
          this.loadFullCustomer(this.orderData.profile);
        }
      },
    });
  }

  loadProducts(): void {
    this.productService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.products = data.data || data.results || [];
      },
    });
  }

  loadCombos(): void {
    this.comboService
      .getAll({ limit: 1000, populate: 'items.selectableProducts.product' })
      .subscribe({
        next: (data: any) => {
          this.combos = data.data || data.results || [];
        },
      });
  }

  // ----------------- Customer / shipping -----------------

  onCustomerChange(customerId: string): void {
    if (!customerId) {
      this.orderData.profile = null;
      this.orderData.profileType = null;
      this.selectedCustomer = null;
      this.selectedShippingAddressId = 'new';
      this.shippingAddressOptions = [];
      return;
    }

    this.orderData.profile = customerId;
    this.orderData.profileType = 'Customer';

    this.selectedCustomer = this.customers.find((c) => c.id === customerId) || null;

    this.buildShippingAddressOptions();

    if (this.orderData.orderType === 'Delivery') {
      const defaultAddress = this.selectedCustomer?.addresses?.find((a) => a.isDefault) || null;
      const defaultIndex = this.selectedCustomer?.addresses?.findIndex((a) => a.isDefault) ?? -1;

      this.ensureShippingExists();

      if (defaultAddress) {
        this.orderData.shipping!.address = {
          ...DEFAULT_SHIPPING_ADDRESS,
          ...defaultAddress,
          recipientName: defaultAddress.recipientName || this.selectedCustomer?.name || '',
          recipientPhone:
            defaultAddress.recipientPhone || this.selectedCustomer?.phones?.[0]?.value || '',
        };
        this.selectedShippingAddressId = defaultIndex.toString();
        this.toastr.info('Default shipping address auto-filled.');
      } else {
        this.orderData.shipping!.address = { ...DEFAULT_SHIPPING_ADDRESS };
        this.selectedShippingAddressId = 'new';
      }
    }
  }

  buildShippingAddressOptions(): void {
    if (!this.selectedCustomer || !this.selectedCustomer.addresses) {
      this.shippingAddressOptions = [];
      return;
    }

    this.shippingAddressOptions = this.selectedCustomer.addresses.map((addr, index) => ({
      id: index.toString(),
      label: addr.label || `${addr.street}, ${addr.city}`,
    }));

    this.shippingAddressOptions.push({
      id: 'new',
      label: '--- Enter New Address ---',
    });
  }

  onShippingAddressChange(selectionId: string): void {
    this.selectedShippingAddressId = selectionId;
    this.ensureShippingExists();

    if (selectionId === 'new') {
      this.orderData.shipping!.address = { ...DEFAULT_SHIPPING_ADDRESS };

      if (this.selectedCustomer) {
        this.orderData.shipping!.address.recipientName = this.selectedCustomer.name;
        this.orderData.shipping!.address.recipientPhone =
          this.selectedCustomer.phones?.[0]?.value || '';
      }
      return;
    }

    const index = parseInt(selectionId, 10);
    const selectedAddr = this.selectedCustomer?.addresses?.[index];
    if (!selectedAddr) return;

    this.orderData.shipping!.address = {
      ...DEFAULT_SHIPPING_ADDRESS,
      ...selectedAddr,
    };
  }

  onOrderTypeChange(type: 'TakeAway' | 'DineIn' | 'Delivery'): void {
    this.orderData.orderType = type;

    if (type === 'Delivery') {
      this.ensureShippingExists();
      this.onCustomerChange(this.orderData.profile || '');
      return;
    }

    this.orderData.shipping = null;
    this.orderData.shippingFee = 0;
    this.calculateTotals();
  }

  ensureShippingExists(): void {
    if (!this.orderData.shipping) {
      this.orderData.shipping = {
        address: { ...DEFAULT_SHIPPING_ADDRESS },
        status: 'pending' as ShippingStatus,
      };
    }
  }

  // ----------------- Order items (common) -----------------

  addOrderItem(): void {
    const newItem: OrderItem = {
      item: '',
      itemType: 'Product',
      name: '',
      quantity: 1,
      basePrice: 0,
      price: 0,
      options: [],
      comboSelections: [],
      note: '',
    };

    this.orderData.items.push(newItem);
    const idx = this.orderData.items.length - 1;

    this.itemTypes.set(idx, 'product');
    this.itemExpandedState.set(idx, true);
  }

  removeOrderItem(index: number): void {
    this.orderData.items.splice(index, 1);

    // Rebuild itemTypes
    const newTypeMap = new Map<number, 'product' | 'combo'>();
    this.orderData.items.forEach((_, i) => {
      const prevType = this.itemTypes.get(i >= index ? i + 1 : i);
      newTypeMap.set(i, prevType || 'product');
    });
    this.itemTypes = newTypeMap;

    // Rebuild expanded state
    const newExpandedMap = new Map<number, boolean>();
    this.orderData.items.forEach((_, i) => {
      const prev = this.itemExpandedState.get(i >= index ? i + 1 : i);
      newExpandedMap.set(i, prev ?? true);
    });
    this.itemExpandedState = newExpandedMap;

    this.calculateTotals();
  }

  getItemType(index: number): 'product' | 'combo' {
    return this.itemTypes.get(index) || 'product';
  }

  toggleItemExpansion(index: number): void {
    const current = this.isItemExpanded(index);
    this.itemExpandedState.set(index, !current);
  }

  isItemExpanded(index: number): boolean {
    return this.itemExpandedState.get(index) ?? true;
  }

  onItemTypeChange(index: number, type: 'product' | 'combo'): void {
    this.itemTypes.set(index, type);
    const item = this.orderData.items[index];

    item.itemType = type === 'product' ? 'Product' : 'Combo';
    item.item = '';
    item.name = '';
    item.basePrice = 0;
    item.price = 0;
    item.quantity = 1;
    item.options = [];
    item.comboSelections = [];

    this.calculateTotals();
  }

  onItemQuantityChange(index: number, quantity: string | number): void {
    const qty = typeof quantity === 'string' ? parseInt(quantity, 10) || 1 : quantity;
    this.orderData.items[index].quantity = qty;
    this.calculateTotals();
  }

  onItemPriceOverride(index: number, price: string | number): void {
    const val = typeof price === 'string' ? parseFloat(price || '0') || 0 : price;
    const item = this.orderData.items[index];

    item.price = val;
    item.basePrice = val;
    item.options = [];
    item.comboSelections = [];

    this.calculateTotals();
  }

  // ----------------- Helpers -----------------

  getProduct(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }

  getCombo(comboId: string): Combo | undefined {
    return this.combos.find((c) => c.id === comboId);
  }

  private getProductIdFromSelection(selection: OrderItemComboSelection): string | null {
    if (!selection.product) return null;
    if (typeof selection.product === 'string') return selection.product;
    return (selection.product as Product).id || null;
  }

  // ----------------- Product logic -----------------

  onProductChange(index: number, productId: string): void {
    const product = this.getProduct(productId);
    if (!product) return;

    const item = this.orderData.items[index];
    item.itemType = 'Product';
    item.item = productId;
    item.name = product.name;
    item.basePrice = product.basePrice || 0;
    item.comboSelections = [];
    item.options = this.getPreselectedOptions(product.optionGroups);

    this.updateItemPrice(index);
  }

  getPreselectedOptions(groups: ProductOptionGroup[] | undefined): OrderItemOption[] {
    if (!groups || groups.length === 0) return [];

    const result: OrderItemOption[] = [];

    groups.forEach((group) => {
      if (group.minOptions <= 0) return;

      const sorted = [...group.options].sort((a, b) => a.priority - b.priority);

      if (group.maxOptions === 1 && sorted.length > 0) {
        // Chọn 1 option ưu tiên cao nhất
        const opt = sorted[0];
        result.push({
          groupName: group.name,
          optionName: opt.name,
          priceModifier: opt.priceModifier,
        });
      } else {
        // Chọn minOptions option đầu
        const selected = sorted.slice(0, Math.min(group.minOptions, sorted.length));
        selected.forEach((opt) => {
          result.push({
            groupName: group.name,
            optionName: opt.name,
            priceModifier: opt.priceModifier,
          });
        });
      }
    });

    return result;
  }

  toggleProductOption(
    itemIndex: number,
    group: ProductOptionGroup,
    option: ProductOption,
    event: Event,
  ): void {
    const item = this.orderData.items[itemIndex];
    const isChecked = (event.target as HTMLInputElement).checked;

    const newOpt: OrderItemOption = {
      groupName: group.name,
      optionName: option.name,
      priceModifier: option.priceModifier,
    };

    const isSelected = item.options.some(
      (o) => o.groupName === group.name && o.optionName === option.name,
    );

    let newOptions = [...item.options];

    if (group.maxOptions === 1) {
      // Radio
      newOptions = newOptions.filter((o) => o.groupName !== group.name);
      if (isChecked || !isSelected) {
        newOptions.push(newOpt);
      }
    } else {
      // Checkbox
      if (isChecked && !isSelected) {
        const currentCount = newOptions.filter((o) => o.groupName === group.name).length;

        if (currentCount < group.maxOptions) {
          newOptions.push(newOpt);
        } else {
          this.toastr.warning(`Chỉ được chọn tối đa ${group.maxOptions} cho ${group.name}`);
          (event.target as HTMLInputElement).checked = false;
          return;
        }
      } else if (!isChecked && isSelected) {
        newOptions = newOptions.filter(
          (o) => !(o.groupName === group.name && o.optionName === option.name),
        );
      }
    }

    item.options = newOptions;
    this.updateItemPrice(itemIndex);
  }

  isProductOptionSelected(item: OrderItem, groupName: string, optionName: string): boolean {
    return item.options.some((o) => o.groupName === groupName && o.optionName === optionName);
  }

  // ----------------- Combo logic (tối ưu dùng data embed) -----------------

  onComboChange(index: number, comboId: string): void {
    const combo = this.getCombo(comboId);
    const item = this.orderData.items[index];

    if (!combo) {
      item.item = '';
      item.name = '';
      item.basePrice = 0;
      item.price = 0;
      item.comboSelections = [];
      return;
    }

    item.itemType = 'Combo';
    item.item = combo.id;
    item.name = combo.name;
    item.options = [];
    item.comboSelections = this.getPreselectedComboSelections(combo);

    this.updateItemPrice(index);
  }

  getPreselectedComboSelections(combo: Combo): OrderItemComboSelection[] {
    const selections: ExtendedComboSelection[] = [];

    combo.items.forEach((slot) => {
      if (slot.minSelection <= 0) return;

      const list = [...slot.selectableProducts];

      // Ưu tiên sản phẩm rẻ nhất theo mode
      const priceKey =
        combo.pricingMode === ComboPricingMode.SLOT_PRICE ? 'slotPrice' : 'snapshotPrice';

      list.sort((a: any, b: any) => {
        const aPrice = (a[priceKey] || 0) + (a.additionalPrice || 0);
        const bPrice = (b[priceKey] || 0) + (b.additionalPrice || 0);
        return aPrice - bPrice;
      });

      const pick = list.slice(0, Math.min(slot.minSelection, list.length));

      pick.forEach((sp: any) => {
        const product = sp.product as Product;
        if (!product || !product.id) return;

        selections.push({
          slotName: slot.slotName,
          product: product.id,
          productName: product.name,
          productSnapshot: product,
          options: this.getPreselectedOptions(product.optionGroups),
        });
      });
    });

    return selections;
  }

  getComboSlotSelection(item: OrderItem, slotName: string): string | null {
    const sel = item.comboSelections?.find((s) => s.slotName === slotName);
    if (!sel) return null;

    if (typeof sel.product === 'string') return sel.product as string;
    return (sel.product as Product).id || null;
  }

  getComboSelectionForSlot(item: OrderItem, slotName: string): ExtendedComboSelection | undefined {
    return item.comboSelections?.find((s) => s.slotName === slotName) as
      | ExtendedComboSelection
      | undefined;
  }

  getComboSelectionProduct(combo: Combo, selection: OrderItemComboSelection): Product | undefined {
    const sel = selection as ExtendedComboSelection;

    if (sel.productSnapshot) return sel.productSnapshot;

    const productId = this.getProductIdFromSelection(selection);
    if (!productId) return undefined;

    const slot = combo.items.find((s) => s.slotName === selection.slotName);
    if (!slot) return undefined;

    const sp = (slot.selectableProducts as any[]).find((p) => {
      const prod = p.product as any;
      return typeof prod === 'string' ? prod === productId : prod.id === productId;
    });

    const product = sp?.product as Product | undefined;
    if (product && product.id) {
      sel.productSnapshot = product;
    }
    return product;
  }

  onComboProductChange(itemIndex: number, slot: ComboItem, selected: any): void {
    const item = this.orderData.items[itemIndex];
    const combo = this.getCombo(item.item as string);
    if (!combo) return;

    // selected có thể là id (string) hoặc object tùy cấu hình ng-select
    let productId: string | null = null;

    if (typeof selected === 'string') {
      productId = selected;
    } else if (selected && selected.product && selected.product.id) {
      productId = selected.product.id;
    } else if (selected && selected.value) {
      productId = selected.value;
    }

    if (!productId) return;

    const selectable = (slot.selectableProducts as any[]).find((sp) => {
      const prod = sp.product as any;
      return typeof prod === 'string' ? prod === productId : prod.id === productId;
    });

    if (!selectable || !selectable.product) return;

    const product = selectable.product as Product;

    const newSelection: ExtendedComboSelection = {
      slotName: slot.slotName,
      product: product.id,
      productName: product.name,
      productSnapshot: product,
      options: this.getPreselectedOptions(product.optionGroups),
    };

    // Replace selection của slot này
    const others = item.comboSelections.filter((s) => s.slotName !== slot.slotName);
    item.comboSelections = [...others, newSelection];

    this.updateItemPrice(itemIndex);
  }

  toggleComboOption(
    itemIndex: number,
    selection: OrderItemComboSelection,
    group: ProductOptionGroup,
    option: ProductOption,
    event: Event,
  ): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    const newOpt: OrderItemOption = {
      groupName: group.name,
      optionName: option.name,
      priceModifier: option.priceModifier,
    };

    const extSel = selection as ExtendedComboSelection;
    let opts = [...(extSel.options || [])];
    const isSelected = opts.some((o) => o.groupName === group.name && o.optionName === option.name);

    if (group.maxOptions === 1) {
      // Radio
      opts = opts.filter((o) => o.groupName !== group.name);
      if (isChecked || !isSelected) {
        opts.push(newOpt);
      }
    } else {
      // Checkbox
      if (isChecked && !isSelected) {
        const currentCount = opts.filter((o) => o.groupName === group.name).length;

        if (currentCount < group.maxOptions) {
          opts.push(newOpt);
        } else {
          this.toastr.warning(`Chỉ được chọn tối đa ${group.maxOptions} cho ${group.name}`);
          (event.target as HTMLInputElement).checked = false;
          return;
        }
      } else if (!isChecked && isSelected) {
        opts = opts.filter((o) => !(o.groupName === group.name && o.optionName === option.name));
      }
    }

    extSel.options = opts;
    this.updateItemPrice(itemIndex);
  }

  isComboOptionSelected(
    selection: OrderItemComboSelection,
    groupName: string,
    optionName: string,
  ): boolean {
    return (selection.options || []).some(
      (o) => o.groupName === groupName && o.optionName === optionName,
    );
  }

  // ----------------- Pricing -----------------

  private calculateOptionsPrice(
    product: Product | undefined,
    selectedOptions: OrderItemOption[],
  ): number {
    if (!product || !product.optionGroups || !selectedOptions.length) {
      return 0;
    }

    let price = 0;

    const typeMap = new Map<string, 'fixed_amount' | 'percentage'>();

    product.optionGroups.forEach((group) => {
      group.options.forEach((opt) => {
        typeMap.set(`${group.name}::${opt.name}`, opt.type);
      });
    });

    selectedOptions.forEach((sel) => {
      const type = typeMap.get(`${sel.groupName}::${sel.optionName}`);
      if (type === 'percentage') {
        price += Math.round((product.basePrice || 0) * (sel.priceModifier / 100));
      } else {
        price += sel.priceModifier;
      }
    });

    return price;
  }

  updateItemPrice(itemIndex: number): void {
    const item = this.orderData.items[itemIndex];
    let newPrice = 0;

    if (item.itemType === 'Product') {
      const product = this.getProduct(item.item as string);
      newPrice =
        (product?.basePrice || 0) + this.calculateOptionsPrice(product, item.options || []);
    } else if (item.itemType === 'Combo') {
      const combo = this.getCombo(item.item as string);
      if (combo) {
        const selections = item.comboSelections || [];

        // 1. Base theo pricingMode
        if (combo.pricingMode === ComboPricingMode.FIXED) {
          newPrice = combo.comboPrice || 0;
        } else {
          let baseTotal = 0;
          let additionalTotal = 0;

          selections.forEach((sel) => {
            const slot = combo.items.find((s) => s.slotName === sel.slotName);
            if (!slot) return;

            const productId = this.getProductIdFromSelection(sel);
            if (!productId) return;

            const sp = (slot.selectableProducts as any[]).find((p) => {
              const prod = p.product as any;
              return typeof prod === 'string' ? prod === productId : prod.id === productId;
            });

            if (!sp) return;

            if (combo.pricingMode === ComboPricingMode.SLOT_PRICE) {
              baseTotal += sp.slotPrice || 0;
            } else if (combo.pricingMode === ComboPricingMode.DISCOUNT) {
              baseTotal += sp.snapshotPrice || 0;
            }
            additionalTotal += sp.additionalPrice || 0;
          });

          if (combo.pricingMode === ComboPricingMode.SLOT_PRICE) {
            newPrice = baseTotal + additionalTotal;
          } else if (combo.pricingMode === ComboPricingMode.DISCOUNT) {
            let discounted = baseTotal;

            if (combo.discountType === DiscountType.PERCENT) {
              discounted = baseTotal * (1 - (combo.discountValue || 0) / 100);
            } else if (combo.discountType === DiscountType.AMOUNT) {
              discounted = Math.max(0, baseTotal - (combo.discountValue || 0));
            }

            newPrice = discounted + additionalTotal;
          }
        }

        // 2. Cộng giá options trên từng selection
        const optionsTotal = selections.reduce((sum, sel) => {
          const product = this.getComboSelectionProduct(combo, sel);
          if (!product) return sum;
          return sum + this.calculateOptionsPrice(product, sel.options || []);
        }, 0);

        newPrice += optionsTotal;
      }
    }

    item.price = newPrice;
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.orderData.totalAmount = this.orderData.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      return sum + price * (item.quantity || 1);
    }, 0);

    const discountValue =
      typeof this.orderData.discountValue === 'string'
        ? parseFloat(this.orderData.discountValue) || 0
        : this.orderData.discountValue || 0;

    let discount = 0;
    if (this.orderData.discountType === 'percentage') {
      discount = (this.orderData.totalAmount * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    const shipping =
      typeof this.orderData.shippingFee === 'string'
        ? parseFloat(this.orderData.shippingFee) || 0
        : this.orderData.shippingFee || 0;

    this.orderData.grandTotal = this.orderData.totalAmount - discount + shipping;
  }

  // ----------------- Validation -----------------

  validateForm(): boolean {
    if (!this.orderData.items.length) {
      this.toastr.error('Please add at least one item', 'Validation Error');
      return false;
    }

    for (let i = 0; i < this.orderData.items.length; i++) {
      const item = this.orderData.items[i];

      if (!item.item) {
        this.toastr.error(`Item ${i + 1}: Please select a product or combo`, 'Validation Error');
        return false;
      }

      if (item.quantity <= 0) {
        this.toastr.error(`Item ${i + 1}: Quantity must be > 0`, 'Validation Error');
        return false;
      }

      // Product validation
      if (item.itemType === 'Product') {
        const product = this.getProduct(item.item as string);
        if (!product || !product.optionGroups) continue;

        for (const group of product.optionGroups) {
          const count = item.options.filter((o) => o.groupName === group.name).length;

          if (count < group.minOptions) {
            this.toastr.error(
              `Item ${i + 1} (${product.name}): "${group.name}" requires at least ${group.minOptions} selection(s)`,
              'Validation Error',
              { timeOut: 5000 },
            );
            return false;
          }
        }
      }

      // Combo validation
      if (item.itemType === 'Combo') {
        const combo = this.getCombo(item.item as string);
        if (!combo) continue;

        for (const slot of combo.items) {
          const slotSelections = item.comboSelections.filter((s) => s.slotName === slot.slotName);

          if (slotSelections.length < slot.minSelection) {
            this.toastr.error(
              `Item ${i + 1} (${combo.name}): Slot "${slot.slotName}" requires at least ${slot.minSelection} product(s)`,
              'Validation Error',
              { timeOut: 5000 },
            );
            return false;
          }

          // Validate options per product trong combo
          for (const sel of slotSelections) {
            const product = this.getComboSelectionProduct(combo, sel);
            if (!product || !product.optionGroups) continue;

            for (const group of product.optionGroups) {
              const count = sel.options.filter((o) => o.groupName === group.name).length;

              if (count < group.minOptions) {
                this.toastr.error(
                  `Item ${i + 1} (${product.name} in combo): "${group.name}" requires at least ${group.minOptions} selection(s)`,
                  'Validation Error',
                  { timeOut: 5000 },
                );
                return false;
              }
            }
          }
        }
      }
    }

    if (this.orderData.orderType === 'Delivery') {
      const addr = this.orderData.shipping?.address;
      if (!addr?.recipientName || !addr?.recipientPhone || !addr?.street || !addr?.city) {
        this.toastr.error('Please fill in all required shipping fields', 'Validation Error');
        return false;
      }
    }

    return true;
  }

  // ----------------- Submit -----------------

  onSaveDraft(): void {
    this.orderData.status = 'pending';
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.calculateTotals();

    const payload: any = deepSanitize(this.orderData, DEFAULT_FORM);

    // Chuẩn hóa discount gửi lên BE
    let discount = 0;
    if (payload.discountType === 'percentage') {
      discount = (payload.totalAmount * payload.discountValue) / 100;
    } else {
      discount = payload.discountValue;
    }
    payload.discountAmount = discount;
    delete payload.discountType;
    delete payload.discountValue;

    if (payload.profile) payload.profileType = 'Customer';
    else payload.profileType = null;

    const obs =
      this.isEditMode && this.orderId
        ? this.orderService.update(this.orderId, payload)
        : this.orderService.create(payload);

    obs.subscribe({
      next: () => {
        this.toastr.success(this.isEditMode ? 'Order updated!' : 'Order created!', 'Success');
        this.router.navigateByUrl('/order');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err?.error?.message || 'Failed to save order', 'Error');
      },
    });
  }
}
