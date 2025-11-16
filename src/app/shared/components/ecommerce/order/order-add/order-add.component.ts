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
  Order,
  OrderItem,
  OrderItemOption,
  OrderItemComboSelection,
  OrderPayment,
  OrderShipping,
  OrderShippingAddress,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingStatus,
} from '../../../../models/order.model';

import { Product, ProductOptionGroup, ProductOption } from '../../../../models/product.model';

import { Combo, ComboItem, ComboPricingMode, DiscountType } from '../../../../models/combo.model';

import { Customer } from '../../../../models/customer.model';

import { OrderService } from '../../../../services/api/order.service';
import { ProductService } from '../../../../services/api/product.service';
import { ComboService } from '../../../../services/api/combo.service';
import { CustomerService } from '../../../../services/api/customer.service';

import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';

// ===== Form model =====
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

  // map for Product / Combo radio
  itemTypes: Map<number, 'product' | 'combo'> = new Map();

  // expand / collapse each item
  itemExpandedState: Map<number, boolean> = new Map();

  // shipping address
  selectedCustomer: Customer | null = null;
  selectedShippingAddressId: string = 'new';
  shippingAddressOptions: { id: string; label: string }[] = [];

  // options
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

  // enum for template
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

  // ===== LIFECYCLE =====
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

  // ===== LOAD DATA =====
  private normalizeOrderItem(raw: OrderItem): OrderItem {
    const item: OrderItem = {
      ...raw,
      options: raw.options ? [...raw.options] : [],
      comboSelections: raw.comboSelections
        ? raw.comboSelections.map((sel) => ({
            ...sel,
            product: typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id,
            options: sel.options ? [...sel.options] : [],
          }))
        : [],
    } as any;

    if (raw.item && typeof raw.item === 'object') {
      (item as any).item = (raw.item as any).id;
    }

    if (!item.itemType) {
      item.itemType = 'Product';
    }

    return item;
  }

  loadOrder(id: string): void {
    this.orderService.getById(id).subscribe({
      next: (data: Order) => {
        const normalizedItems =
          (data.items || []).map((it: any) => this.normalizeOrderItem(it as OrderItem)) ?? [];

        this.orderData = {
          ...DEFAULT_FORM,
          ...(data as any),
          items: normalizedItems,
          discountType: 'fixed',
          discountValue: data.discountAmount || 0,
        };

        // profile
        if (data.profile && data.profileType === 'Customer') {
          const customerId = (data.profile as any).id || (data.profile as any);
          this.orderData.profile = customerId;
          this.loadFullCustomer(customerId);
          this.orderData.profileType = 'Customer';
        } else {
          this.orderData.profileType = null;
        }

        // rebuild maps
        this.itemTypes.clear();
        this.itemExpandedState.clear();
        this.orderData.items.forEach((item, index) => {
          this.itemTypes.set(index, item.itemType === 'Combo' ? 'combo' : 'product');
          this.itemExpandedState.set(index, false); // default collapsed on load
        });

        this.calculateTotals();
      },
      error: () => this.toastr.error('Cannot load order data', 'Error'),
    });
  }

  loadFullCustomer(customerId: string): void {
    const cached = this.customers.find((c) => c.id === customerId);
    const handle = (cust: Customer) => {
      this.selectedCustomer = cust;
      this.buildShippingAddressOptions();
      this.selectedShippingAddressId = 'new';
    };

    if (cached) {
      handle(cached);
    } else {
      this.customerService.getById(customerId).subscribe((cust) => handle(cust));
    }
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

  // ===== COMMON HELPERS =====
  private getProductById(id: string | null | undefined): Product | undefined {
    if (!id) return undefined;
    return this.products.find((p) => p.id === id);
  }

  getProduct(id: string | null | undefined): Product | undefined {
    return this.getProductById(id);
  }

  getCombo(id: string | null | undefined): Combo | undefined {
    if (!id) return undefined;
    return this.combos.find((c) => c.id === id);
  }

  // ===== CUSTOMER / SHIPPING =====
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
      const defaultAddress = this.selectedCustomer?.addresses?.find((a) => a.isDefault);
      const defaultIdx = this.selectedCustomer?.addresses?.findIndex((a) => a.isDefault) ?? -1;

      this.ensureShippingExists();

      if (defaultAddress) {
        this.orderData.shipping!.address = {
          ...DEFAULT_SHIPPING_ADDRESS,
          ...defaultAddress,
          recipientName: defaultAddress.recipientName || this.selectedCustomer?.name || '',
          recipientPhone:
            defaultAddress.recipientPhone || this.selectedCustomer?.phones?.[0]?.value || '',
        };
        this.selectedShippingAddressId = defaultIdx.toString();
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
      if (this.orderData.profile) {
        this.onCustomerChange(this.orderData.profile);
      }
    } else {
      this.orderData.shipping = null;
      this.orderData.shippingFee = 0;
      this.calculateTotals();
    }
  }

  ensureShippingExists(): void {
    if (!this.orderData.shipping) {
      this.orderData.shipping = {
        address: { ...DEFAULT_SHIPPING_ADDRESS },
        status: 'pending' as ShippingStatus,
      };
    }
  }

  // ===== ORDER ITEMS (COMMON) =====
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
    this.itemExpandedState.set(idx, true); // new row expanded
  }

  removeOrderItem(index: number): void {
    this.orderData.items.splice(index, 1);

    // re-build maps for itemTypes
    const newTypeMap = new Map<number, 'product' | 'combo'>();
    this.itemTypes.forEach((value, key) => {
      if (key < index) newTypeMap.set(key, value);
      else if (key > index) newTypeMap.set(key - 1, value);
    });
    this.itemTypes = newTypeMap;

    // re-build maps for expand state
    const newExpandedMap = new Map<number, boolean>();
    this.itemExpandedState.forEach((value, key) => {
      if (key < index) newExpandedMap.set(key, value);
      else if (key > index) newExpandedMap.set(key - 1, value);
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
    const q = typeof quantity === 'string' ? parseInt(quantity || '1', 10) || 1 : quantity;
    this.orderData.items[index].quantity = q;
    this.calculateTotals();
  }

  onItemPriceOverride(index: number, price: string | number): void {
    const p = typeof price === 'string' ? parseFloat(price || '0') || 0 : price;
    const item = this.orderData.items[index];

    item.price = p;
    item.basePrice = p;
    item.options = [];
    item.comboSelections = [];

    this.calculateTotals();
  }

  // ===== PRODUCT LOGIC =====
  onProductChange(index: number, productId: string): void {
    const product = this.getProductById(productId);
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
    if (!groups || !groups.length) return [];

    const res: OrderItemOption[] = [];

    groups.forEach((group) => {
      const sorted = [...group.options].sort((a, b) => a.priority - b.priority);

      if (group.minOptions > 0) {
        if (group.maxOptions === 1 && sorted.length > 0) {
          const opt = sorted[0];
          res.push({
            groupName: group.name,
            optionName: opt.name,
            priceModifier: opt.priceModifier,
          });
        } else {
          const toSelect = sorted.slice(0, Math.min(group.minOptions, sorted.length));
          toSelect.forEach((opt) => {
            res.push({
              groupName: group.name,
              optionName: opt.name,
              priceModifier: opt.priceModifier,
            });
          });
        }
      }
    });

    return res;
  }

  toggleProductOption(
    itemIndex: number,
    group: ProductOptionGroup,
    option: ProductOption,
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;
    const item = this.orderData.items[itemIndex];

    const newOption: OrderItemOption = {
      groupName: group.name,
      optionName: option.name,
      priceModifier: option.priceModifier,
    };

    const isSelected = item.options.some(
      (o) => o.groupName === group.name && o.optionName === option.name,
    );

    let newOptions = [...item.options];

    if (group.maxOptions === 1) {
      // radio: chỉ giữ 1 option trong group
      newOptions = newOptions.filter((o) => o.groupName !== group.name);
      if (isChecked || !isSelected) {
        newOptions.push(newOption);
      }
    } else {
      // checkbox
      if (isChecked && !isSelected) {
        const currentCount = newOptions.filter((o) => o.groupName === group.name).length;
        if (currentCount < group.maxOptions) {
          newOptions.push(newOption);
        } else {
          this.toastr.warning(`Chỉ được chọn tối đa ${group.maxOptions} cho ${group.name}`);
          input.checked = false;
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

  // ===== COMBO LOGIC (DÙNG DATA POPULATED TỪ API) =====
  onComboChange(index: number, comboId: string): void {
    const combo = this.getCombo(comboId);
    if (!combo) return;

    const item = this.orderData.items[index];

    item.itemType = 'Combo';
    item.item = combo.id;
    item.name = combo.name;
    item.options = [];
    item.comboSelections = [];

    // Preselect tối thiểu minSelection mỗi slot
    combo.items.forEach((slot) => {
      if (slot.minSelection <= 0) return;

      const candidates = slot.selectableProducts.slice(0, slot.minSelection);

      candidates.forEach((sp) => {
        const prod: any = sp.product;

        item.comboSelections!.push({
          slotName: slot.slotName,
          product: prod.id,
          productName: prod.name,
          options: this.getPreselectedOptions(prod.optionGroups),
        });
      });
    });

    this.updateItemPrice(index);
  }

  getComboSlotSelection(item: OrderItem, slotName: string): string | null {
    const sel = item.comboSelections?.find((s) => s.slotName === slotName);
    if (!sel || !sel.product) return null;

    if (typeof sel.product === 'string') return sel.product;
    return (sel.product as any).id ?? null;
  }

  getComboSelectionForSlot(item: OrderItem, slotName: string): OrderItemComboSelection | undefined {
    return item.comboSelections?.find((s) => s.slotName === slotName);
  }

  getComboSelectionProduct(
    combo: Combo | undefined,
    selection: OrderItemComboSelection | undefined,
  ): Product | undefined {
    if (!combo || !selection) return undefined;

    const slot = combo.items.find((s) => s.slotName === selection.slotName);
    if (!slot) return undefined;

    const selectedId =
      typeof selection.product === 'string' ? selection.product : (selection.product as any)?.id;

    const sp = slot.selectableProducts.find((sp) => {
      const prod: any = sp.product;
      if (!prod) return false;
      return typeof prod === 'string' ? prod === selectedId : prod.id === selectedId;
    });

    if (!sp) return this.getProductById(selectedId);
    const prodObj: any = sp.product;
    return typeof prodObj === 'object' ? (prodObj as Product) : this.getProductById(selectedId);
  }

  onComboProductChange(index: number, slot: ComboItem, productId: string): void {
    const item = this.orderData.items[index];
    if (!productId) return;

    // tìm selectableProduct trong chính combo slot
    const selectable = slot.selectableProducts.find((sp: any) => {
      const pid = typeof sp.product === 'string' ? sp.product : sp.product.id;
      return pid === productId;
    });

    if (!selectable) return;

    // Lấy product object chuẩn
    let prodObj: Product | undefined;
    if (typeof selectable.product === 'string') {
      prodObj = this.getProduct(selectable.product);
    } else {
      prodObj = selectable.product as Product;
    }
    if (!prodObj) return;

    const newSelection: OrderItemComboSelection = {
      slotName: slot.slotName,
      product: prodObj.id,
      productName: prodObj.name,
      options: this.getPreselectedOptions(prodObj.optionGroups),
    };

    // Giữ duy nhất selection cho slot này (vì maxSelection = 1)
    const others = (item.comboSelections || []).filter((s) => s.slotName !== slot.slotName);
    item.comboSelections = [...others, newSelection];

    this.updateItemPrice(index);
  }

  toggleComboOption(
    itemIndex: number,
    selection: OrderItemComboSelection,
    group: ProductOptionGroup,
    option: ProductOption,
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;
    const isChecked = input.checked;

    const newOpt: OrderItemOption = {
      groupName: group.name,
      optionName: option.name,
      priceModifier: option.priceModifier,
    };

    const isSelected = selection.options.some(
      (o) => o.groupName === group.name && o.optionName === option.name,
    );

    let newOptions = [...selection.options];

    if (group.maxOptions === 1) {
      newOptions = newOptions.filter((o) => o.groupName !== group.name);
      if (isChecked || !isSelected) {
        newOptions.push(newOpt);
      }
    } else {
      if (isChecked && !isSelected) {
        const currentCount = newOptions.filter((o) => o.groupName === group.name).length;
        if (currentCount < group.maxOptions) {
          newOptions.push(newOpt);
        } else {
          this.toastr.warning(`Chỉ được chọn tối đa ${group.maxOptions} cho ${group.name}`);
          input.checked = false;
          return;
        }
      } else if (!isChecked && isSelected) {
        newOptions = newOptions.filter(
          (o) => !(o.groupName === group.name && o.optionName === option.name),
        );
      }
    }

    selection.options = newOptions;
    this.updateItemPrice(itemIndex);
  }

  isComboOptionSelected(
    selection: OrderItemComboSelection,
    groupName: string,
    optionName: string,
  ): boolean {
    return selection.options.some((o) => o.groupName === groupName && o.optionName === optionName);
  }

  // ===== PRICE CALCULATION =====
  private calculateOptionsPrice(
    product: Product | undefined,
    selectedOptions: OrderItemOption[],
  ): number {
    if (!product || !product.optionGroups || !selectedOptions.length) return 0;

    let price = 0;

    const optionTypeMap = new Map<string, 'fixed_amount' | 'percentage'>();
    product.optionGroups.forEach((group) => {
      group.options.forEach((opt) => {
        optionTypeMap.set(`${group.name}::${opt.name}`, opt.type);
      });
    });

    selectedOptions.forEach((selOpt) => {
      const type = optionTypeMap.get(`${selOpt.groupName}::${selOpt.optionName}`);
      if (type === 'percentage') {
        price += Math.round((product.basePrice || 0) * (selOpt.priceModifier / 100));
      } else {
        price += selOpt.priceModifier;
      }
    });

    return price;
  }

  updateItemPrice(itemIndex: number): void {
    const item = this.orderData.items[itemIndex];
    let newPrice = 0;

    if (item.itemType === 'Product') {
      const product = this.getProductById(item.item as string);
      newPrice =
        (product?.basePrice || 0) + this.calculateOptionsPrice(product, item.options || []);
    } else if (item.itemType === 'Combo') {
      const combo = this.getCombo(item.item as string);
      if (combo) {
        const selections = item.comboSelections || [];

        // 1. base combo price
        if (combo.pricingMode === ComboPricingMode.FIXED) {
          newPrice = combo.comboPrice || 0;
        } else if (combo.pricingMode === ComboPricingMode.SLOT_PRICE) {
          newPrice = selections.reduce((sum, sel) => {
            const slot = combo.items.find((s) => s.slotName === sel.slotName);
            if (!slot) return sum;

            const selProdId =
              typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;

            const sp = slot.selectableProducts.find((p) => {
              const prod: any = p.product;
              if (!prod) return false;
              return typeof prod === 'string' ? prod === selProdId : prod.id === selProdId;
            });

            return sum + (sp?.slotPrice || 0);
          }, 0);
        } else if (combo.pricingMode === ComboPricingMode.DISCOUNT) {
          const baseTotal = selections.reduce((sum, sel) => {
            const slot = combo.items.find((s) => s.slotName === sel.slotName);
            if (!slot) return sum;

            const selProdId =
              typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;

            const sp = slot.selectableProducts.find((p) => {
              const prod: any = p.product;
              if (!prod) return false;
              return typeof prod === 'string' ? prod === selProdId : prod.id === selProdId;
            });

            return sum + (sp?.snapshotPrice || 0);
          }, 0);

          if (combo.discountType === DiscountType.PERCENT) {
            newPrice = baseTotal * (1 - (combo.discountValue || 0) / 100);
          } else if (combo.discountType === DiscountType.AMOUNT) {
            newPrice = Math.max(0, baseTotal - (combo.discountValue || 0));
          } else {
            newPrice = baseTotal;
          }
        }

        // 2. additionalPrice
        const totalAdditional = selections.reduce((sum, sel) => {
          const slot = combo.items.find((s) => s.slotName === sel.slotName);
          if (!slot) return sum;

          const selProdId =
            typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;

          const sp = slot.selectableProducts.find((p) => {
            const prod: any = p.product;
            if (!prod) return false;
            return typeof prod === 'string' ? prod === selProdId : prod.id === selProdId;
          });

          return sum + (sp?.additionalPrice || 0);
        }, 0);
        newPrice += totalAdditional;

        // 3. options price
        const totalOptionsPrice = selections.reduce((sum, sel) => {
          const selProdId =
            typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;

          const product = this.getProductById(selProdId);
          return sum + this.calculateOptionsPrice(product, sel.options);
        }, 0);
        newPrice += totalOptionsPrice;
      }
    }

    item.price = newPrice;
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.orderData.totalAmount = this.orderData.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      return sum + price * (item.quantity || 0);
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

  // ===== HELPER: MAP OPTIONS / COMBO SELECTIONS -> API FORMAT =====
  private mapOptionsForApi(
    options: OrderItemOption[] | undefined | null,
  ): Record<string, { name: string; priceModifier: number }[]> {
    if (!options || !options.length) return {};

    const result: Record<string, { name: string; priceModifier: number }[]> = {};

    for (const opt of options) {
      if (!result[opt.groupName]) {
        result[opt.groupName] = [];
      }
      result[opt.groupName].push({
        name: opt.optionName,
        priceModifier: opt.priceModifier,
      });
    }

    return result;
  }

  private findProductForComboSelection(
    comboId: string | undefined,
    slotName: string,
    productId: string,
  ): Product | undefined {
    if (!comboId) return this.getProductById(productId);

    const combo = this.getCombo(comboId);
    if (!combo) return this.getProductById(productId);

    const slot = combo.items.find((s) => s.slotName === slotName);
    if (!slot) return this.getProductById(productId);

    const sp = slot.selectableProducts.find((p: any) => {
      const prod: any = p.product;
      const pid = typeof prod === 'string' ? prod : prod?.id;
      return pid === productId;
    });

    if (!sp) return this.getProductById(productId);

    const prodObj: any = sp.product;
    if (typeof prodObj === 'object') return prodObj as Product;

    return this.getProductById(prodObj);
  }

  private mapComboSelectionForApi(orderItem: OrderItem, sel: OrderItemComboSelection) {
    const comboId = orderItem.item as string;
    const selProdId = typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;

    const prod = this.findProductForComboSelection(comboId, sel.slotName, selProdId);

    return {
      slotName: sel.slotName,
      product: {
        id: prod?.id || selProdId,
        name: prod?.name || sel.productName || '',
        basePrice: prod?.basePrice ?? 0,
      },
      options: this.mapOptionsForApi(sel.options),
    };
  }

  private mapOrderItemForApi(item: OrderItem): any {
    const quantity = item.quantity || 0;
    const unitPrice =
      typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
    const totalPrice = unitPrice * quantity;

    if (item.itemType === 'Combo') {
      const combo = this.getCombo(item.item as string);

      return {
        itemType: 'Combo',
        item: {
          id: combo?.id || (item.item as any),
          name: combo?.name || item.name || '',
          comboPrice: combo?.comboPrice ?? 0,
        },
        totalPrice,
        options: null,
        comboSelections: (item.comboSelections || []).map((sel) =>
          this.mapComboSelectionForApi(item, sel),
        ),
        quantity,
        note: item.note || '',
      };
    }

    // Product
    const product = this.getProductById(item.item as string);

    return {
      itemType: 'Product',
      item: {
        id: product?.id || (item.item as any),
        name: product?.name || item.name || '',
        basePrice: product?.basePrice ?? item.basePrice ?? 0,
      },
      totalPrice,
      options: this.mapOptionsForApi(item.options),
      comboSelections: null,
      quantity,
      note: item.note || '',
    };
  }

  private buildApiPayload(): any {
    // Tính lại totals cho chắc
    this.calculateTotals();

    const base: any = deepSanitize(this.orderData, DEFAULT_FORM);

    // Map items -> đúng schema backend (giống foody-user)
    base.items = this.orderData.items.map((it) => this.mapOrderItemForApi(it));

    base.totalAmount = this.orderData.totalAmount;
    base.grandTotal = this.orderData.grandTotal;

    // Discount
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
    base.discountAmount = discount;

    delete base.discountType;
    delete base.discountValue;

    // Profile type
    if (base.profile) base.profileType = 'Customer';
    else base.profileType = null;

    // appliedCoupons giống foody-user
    if (!base.appliedCoupons) base.appliedCoupons = [];

    return base;
  }

  // ===== VALIDATION & SUBMIT =====
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

      // Product options validation
      if (item.itemType === 'Product') {
        const product = this.getProductById(item.item as string);
        if (!product || !product.optionGroups) continue;

        for (const group of product.optionGroups) {
          const count = (item.options || []).filter((o) => o.groupName === group.name).length;
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
          const selectionCount = (item.comboSelections || []).filter(
            (s) => s.slotName === slot.slotName,
          ).length;

          if (selectionCount < slot.minSelection) {
            this.toastr.error(
              `Item ${i + 1} (${combo.name}): Slot "${slot.slotName}" requires at least ${slot.minSelection} product(s)`,
              'Validation Error',
              { timeOut: 5000 },
            );
            return false;
          }

          const selectionsInSlot = (item.comboSelections || []).filter(
            (s) => s.slotName === slot.slotName,
          );

          for (const sel of selectionsInSlot) {
            const selProdId =
              typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;
            const product = this.getProductById(selProdId);

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
      if (!addr?.recipientName || !addr.recipientPhone || !addr.street || !addr.city) {
        this.toastr.error('Please fill in all required shipping fields', 'Validation Error');
        return false;
      }
    }

    return true;
  }

  onSaveDraft(): void {
    this.orderData.status = 'pending';
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    const payload = this.buildApiPayload();

    const obs =
      this.isEditMode && this.orderId
        ? this.orderService.update(this.orderId, payload)
        : this.orderService.createAdminOrder(payload);

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
