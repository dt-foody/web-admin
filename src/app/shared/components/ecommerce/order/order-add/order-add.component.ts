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

// Interface cho form data (Giữ nguyên)
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

  // Map điều khiển UI (radio button)
  itemTypes: Map<number, 'product' | 'combo'> = new Map();

  // === MỚI: Map quản lý trạng thái Mở/Đóng của item ===
  itemExpandedState: Map<number, boolean> = new Map();
  // =================================================

  // Quản lý địa chỉ
  selectedCustomer: Customer | null = null;
  selectedShippingAddressId: string = 'new';
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

  // Enum access cho template
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

  // --- Các hàm Load Data ---
  loadOrder(id: string) {
    this.orderService.getById(id).subscribe({
      next: (data: Order) => {
        this.orderData = { ...DEFAULT_FORM, ...(data as any) };
        this.orderData.discountType = 'fixed';
        this.orderData.discountValue = data.discountAmount || 0;

        if (data.profile && data.profileType === 'Customer') {
          const customerId = (data.profile as any).id || data.profile;
          this.orderData.profile = customerId;
          this.loadFullCustomer(customerId);
        }

        this.itemTypes.clear();
        this.itemExpandedState.clear(); // Xóa trạng thái cũ
        this.orderData.items.forEach((item, index) => {
          this.itemTypes.set(index, item.itemType === 'Combo' ? 'combo' : 'product');
          // Mặc định ban đầu là thu gọn khi load (hoặc 'true' nếu muốn mở)
          this.itemExpandedState.set(index, false);
        });
        this.calculateTotals();
      },
      error: (err) => this.toastr.error('Cannot load order data', 'Error'),
    });
  }
  loadFullCustomer(customerId: string) {
    const customer = this.customers.find((c) => c.id === customerId);
    if (customer) {
      this.selectedCustomer = customer;
      this.buildShippingAddressOptions();
      this.selectedShippingAddressId = 'new';
    } else {
      this.customerService.getById(customerId).subscribe((cust) => {
        this.selectedCustomer = cust;
        this.buildShippingAddressOptions();
        this.selectedShippingAddressId = 'new';
      });
    }
  }
  loadCustomers() {
    this.customerService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.customers = data.data || data.results || [];
        if (this.isEditMode && this.orderData.profile) {
          this.loadFullCustomer(this.orderData.profile);
        }
      },
    });
  }
  loadProducts() {
    this.productService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.products = data.data || data.results || [];
      },
    });
  }
  loadCombos() {
    this.comboService.getAll({ limit: 1000 }).subscribe({
      next: (data: any) => {
        this.combos = data.data || data.results || [];
      },
    });
  }

  // --- Xử lý Form chung (Customer, Address, OrderType) ---
  onCustomerChange(customerId: string) {
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
      const defaultAddressIndex =
        this.selectedCustomer?.addresses?.findIndex((a) => a.isDefault) ?? -1;

      if (defaultAddress) {
        this.ensureShippingExists();
        this.orderData.shipping!.address = {
          ...DEFAULT_SHIPPING_ADDRESS,
          ...defaultAddress,
          recipientName: defaultAddress.recipientName || this.selectedCustomer?.name || '',
          recipientPhone:
            defaultAddress.recipientPhone || this.selectedCustomer?.phones?.[0]?.value || '',
        };
        this.selectedShippingAddressId = defaultAddressIndex.toString();
        this.toastr.info(`Default shipping address auto-filled.`);
      } else {
        this.ensureShippingExists();
        this.orderData.shipping!.address = { ...DEFAULT_SHIPPING_ADDRESS };
        this.selectedShippingAddressId = 'new';
      }
    }
  }
  buildShippingAddressOptions() {
    if (!this.selectedCustomer || !this.selectedCustomer.addresses) {
      this.shippingAddressOptions = [];
      return;
    }
    this.shippingAddressOptions = this.selectedCustomer.addresses.map((addr, index) => ({
      id: index.toString(),
      label: addr.label || `${addr.street}, ${addr.city}`,
    }));
    this.shippingAddressOptions.push({ id: 'new', label: '--- Enter New Address ---' });
  }
  onShippingAddressChange(selectionId: string) {
    this.selectedShippingAddressId = selectionId;
    this.ensureShippingExists();

    if (selectionId === 'new') {
      this.orderData.shipping!.address = { ...DEFAULT_SHIPPING_ADDRESS };
      if (this.selectedCustomer) {
        this.orderData.shipping!.address.recipientName = this.selectedCustomer.name;
        this.orderData.shipping!.address.recipientPhone =
          this.selectedCustomer.phones?.[0]?.value || '';
      }
    } else {
      const index = parseInt(selectionId, 10);
      const selectedAddr = this.selectedCustomer?.addresses?.[index];
      if (selectedAddr) {
        this.orderData.shipping!.address = {
          ...DEFAULT_SHIPPING_ADDRESS,
          ...selectedAddr,
        };
      }
    }
  }
  onOrderTypeChange(type: 'TakeAway' | 'DineIn' | 'Delivery') {
    this.orderData.orderType = type;
    if (type === 'Delivery') {
      this.ensureShippingExists();
      this.onCustomerChange(this.orderData.profile || '');
    } else {
      this.orderData.shipping = null;
      this.orderData.shippingFee = 0;
      this.calculateTotals();
    }
  }
  ensureShippingExists() {
    if (!this.orderData.shipping) {
      this.orderData.shipping = {
        address: { ...DEFAULT_SHIPPING_ADDRESS },
        status: 'pending' as ShippingStatus,
      };
    }
  }

  // --- Quản lý Order Items (Chung) ---
  addOrderItem() {
    const newItem: OrderItem = {
      item: '', // ID
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
    const newIndex = this.orderData.items.length - 1;

    this.itemTypes.set(newIndex, 'product');

    // === MỚI ===
    // Mặc định item mới là 'mở'
    this.itemExpandedState.set(newIndex, true);
    // ===========
  }

  removeOrderItem(index: number) {
    this.orderData.items.splice(index, 1);

    // Cập nhật itemTypes Map
    this.itemTypes.delete(index);
    const newTypeMap = new Map<number, 'product' | 'combo'>();
    this.itemTypes.forEach((value, key) => {
      if (key > index) newTypeMap.set(key - 1, value);
      else if (key < index) newTypeMap.set(key, value);
    });
    this.itemTypes = newTypeMap;

    // === MỚI ===
    // Cập nhật itemExpandedState Map
    this.itemExpandedState.delete(index);
    const newExpandedMap = new Map<number, boolean>();
    this.itemExpandedState.forEach((value, key) => {
      if (key > index) newExpandedMap.set(key - 1, value);
      else if (key < index) newExpandedMap.set(key, value);
    });
    this.itemExpandedState = newExpandedMap;
    // ===========

    this.calculateTotals();
  }

  getItemType(index: number): 'product' | 'combo' {
    return this.itemTypes.get(index) || 'product';
  }

  // === MỚI: Các hàm quản lý Mở/Đóng ===
  toggleItemExpansion(index: number) {
    const currentState = this.isItemExpanded(index);
    this.itemExpandedState.set(index, !currentState);
  }

  isItemExpanded(index: number): boolean {
    // Mặc định là 'true' (mở) nếu chưa có trong map
    return this.itemExpandedState.get(index) ?? true;
  }
  // =====================================

  onItemTypeChange(index: number, type: 'product' | 'combo') {
    this.itemTypes.set(index, type);
    const item = this.orderData.items[index];
    item.itemType = type === 'product' ? 'Product' : 'Combo';
    item.item = ''; // Reset ID
    item.name = '';
    item.basePrice = 0;
    item.price = 0;
    item.quantity = 1;
    item.options = [];
    item.comboSelections = [];
    this.calculateTotals();
  }

  onItemQuantityChange(index: number, quantity: string | number) {
    const qty = typeof quantity === 'string' ? parseInt(quantity) || 1 : quantity;
    this.orderData.items[index].quantity = qty;
    this.calculateTotals();
  }

  onItemPriceOverride(index: number, price: string | number) {
    const p = typeof price === 'string' ? parseFloat(price) || 0 : price;
    this.orderData.items[index].price = p;
    this.orderData.items[index].basePrice = p;
    this.orderData.items[index].options = [];
    this.orderData.items[index].comboSelections = [];
    this.calculateTotals();
  }

  // --- Helpers ---
  getProduct(productId: string): Product | undefined {
    return this.products.find((p) => p.id === productId);
  }
  getCombo(comboId: string): Combo | undefined {
    return this.combos.find((c) => c.id === comboId);
  }

  // --- Logic PRODUCT ---

  onProductChange(index: number, productId: string) {
    const product = this.getProduct(productId);
    if (product) {
      const item = this.orderData.items[index];
      item.item = productId;
      item.name = product.name;
      item.basePrice = product.basePrice || 0;
      item.comboSelections = [];
      item.options = this.getPreselectedOptions(product.optionGroups);
      this.updateItemPrice(index);
    }
  }

  getPreselectedOptions(groups: ProductOptionGroup[] | undefined): OrderItemOption[] {
    if (!groups) return [];

    const initialOptions: OrderItemOption[] = [];
    groups.forEach((group) => {
      const sorted = [...group.options].sort((a, b) => a.priority - b.priority);

      if (group.minOptions > 0) {
        if (group.maxOptions === 1 && sorted.length > 0) {
          initialOptions.push({
            groupName: group.name,
            optionName: sorted[0].name,
            priceModifier: sorted[0].priceModifier,
          });
        } else {
          const toSelect = sorted.slice(0, Math.min(group.minOptions, sorted.length));
          toSelect.forEach((opt) => {
            initialOptions.push({
              groupName: group.name,
              optionName: opt.name,
              priceModifier: opt.priceModifier,
            });
          });
        }
      }
    });
    return initialOptions;
  }

  toggleProductOption(
    itemIndex: number,
    group: ProductOptionGroup,
    option: ProductOption,
    event: Event,
  ) {
    const item = this.orderData.items[itemIndex];
    const isChecked = (event.target as HTMLInputElement).checked;

    const newOption: OrderItemOption = {
      groupName: group.name,
      optionName: option.name,
      priceModifier: option.priceModifier,
    };

    const isSelected = item.options.some(
      (o) => o.groupName === group.name && o.optionName === option.name,
    );

    let newOptions: OrderItemOption[] = [...item.options];

    if (group.maxOptions === 1) {
      newOptions = newOptions.filter((o) => o.groupName !== group.name);
      if (isChecked || !isSelected) {
        newOptions.push(newOption);
      }
    } else {
      if (isChecked && !isSelected) {
        const currentCount = newOptions.filter((o) => o.groupName === group.name).length;
        if (currentCount < group.maxOptions) {
          newOptions.push(newOption);
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

  // --- Logic COMBO ---

  onComboChange(index: number, comboId: string) {
    const combo = this.getCombo(comboId);
    if (combo) {
      const item = this.orderData.items[index];
      item.item = comboId;
      item.name = combo.name;
      item.basePrice = combo.comboPrice || 0;
      item.options = [];
      item.comboSelections = this.getPreselectedComboSelections(combo);
      this.updateItemPrice(index);
    }
  }

  getPreselectedComboSelections(combo: Combo): OrderItemComboSelection[] {
    const initialSelections: OrderItemComboSelection[] = [];

    combo.items.forEach((slot) => {
      if (slot.minSelection > 0) {
        const priceKey =
          combo.pricingMode === ComboPricingMode.SLOT_PRICE ? 'slotPrice' : 'snapshotPrice';

        const sortedProducts = [...slot.selectableProducts].sort(
          (a, b) => a[priceKey] + a.additionalPrice - (b[priceKey] + b.additionalPrice),
        );

        const itemsToSelect = sortedProducts.slice(0, slot.minSelection);

        itemsToSelect.forEach((prodInfo) => {
          const product = this.getProduct(prodInfo.product);
          if (product) {
            initialSelections.push({
              slotName: slot.slotName,
              product: product.id,
              productName: product.name,
              options: this.getPreselectedOptions(product.optionGroups), // Đệ quy
            });
          }
        });
      }
    });
    return initialSelections;
  }

  getSelectableProductsForSlot(slot: ComboItem): any[] {
    return slot.selectableProducts.map((sp) => {
      // --- BẮT ĐẦU SỬA LỖI ---
      // Chuẩn hóa 'sp.product' (có thể là ID string hoặc Product object)
      const productId = typeof sp.product === 'string' ? sp.product : (sp.product as Product)?.id; // Lấy .id nếu là object

      const product = this.getProduct(productId); // Luôn truyền ID
      // --- KẾT THÚC SỬA LỖI ---

      return {
        productId: productId, // Luôn đảm bảo đây là string ID
        name: product ? product.name : 'Unknown Product',
        productInfo: sp,
        productRef: product,
      };
    });
  }

  getProductIdFromSelection(selection: OrderItemComboSelection): string {
    if (typeof selection.product === 'string') {
      return selection.product;
    }
    return selection.product.id;
  }

  getComboSlotSelection(item: OrderItem, slotName: string): string | null {
    const selection = item.comboSelections.find((s) => s.slotName === slotName);

    if (!selection || !selection.product) {
      return null;
    }

    if (typeof selection.product === 'string') {
      return selection.product;
    }

    return selection.product.id;
  }

  getComboSelectionForSlot(item: OrderItem, slotName: string): OrderItemComboSelection | undefined {
    return item.comboSelections.find((s) => s.slotName === slotName);
  }

  onComboProductChange(index: number, slot: ComboItem, productId: string) {
    const item = this.orderData.items[index];
    const combo = this.getCombo(item.item);
    if (!combo || !productId) return;

    const prodData = this.getSelectableProductsForSlot(slot).find((p) => p.productId === productId);
    if (!prodData || !prodData.productRef) return;

    const product: Product = prodData.productRef;

    const newSelection: OrderItemComboSelection = {
      slotName: slot.slotName,
      product: product.id, // Gán string ID
      productName: product.name,
      options: this.getPreselectedOptions(product.optionGroups),
    };

    if (slot.maxSelection === 1) {
      const otherSelections = item.comboSelections.filter((s) => s.slotName !== slot.slotName);
      item.comboSelections = [...otherSelections, newSelection];
    } else {
      const otherSelections = item.comboSelections.filter((s) => s.slotName !== slot.slotName);
      item.comboSelections = [...otherSelections, newSelection];
    }

    this.updateItemPrice(index);
  }

  isComboProductSelected(item: OrderItem, slotName: string, productId: string): boolean {
    return item.comboSelections.some((s) => s.slotName === slotName && s.product === productId);
  }

  toggleComboOption(
    itemIndex: number,
    selection: OrderItemComboSelection,
    group: ProductOptionGroup,
    option: ProductOption,
    event: Event,
  ) {
    const isChecked = (event.target as HTMLInputElement).checked;

    const newOption: OrderItemOption = {
      groupName: group.name,
      optionName: option.name,
      priceModifier: option.priceModifier,
    };

    const isSelected = selection.options.some(
      (o) => o.groupName === group.name && o.optionName === option.name,
    );

    let newSelectionOptions: OrderItemOption[] = [...selection.options];

    if (group.maxOptions === 1) {
      newSelectionOptions = newSelectionOptions.filter((o) => o.groupName !== group.name);
      if (isChecked || !isSelected) {
        newSelectionOptions.push(newOption);
      }
    } else {
      if (isChecked && !isSelected) {
        const currentCount = newSelectionOptions.filter((o) => o.groupName === group.name).length;
        if (currentCount < group.maxOptions) {
          newSelectionOptions.push(newOption);
        } else {
          this.toastr.warning(`Chỉ được chọn tối đa ${group.maxOptions} cho ${group.name}`);
          (event.target as HTMLInputElement).checked = false;
          return;
        }
      } else if (!isChecked && isSelected) {
        newSelectionOptions = newSelectionOptions.filter(
          (o) => !(o.groupName === group.name && o.optionName === option.name),
        );
      }
    }

    selection.options = newSelectionOptions;

    this.updateItemPrice(itemIndex);
  }

  isComboOptionSelected(
    selection: OrderItemComboSelection,
    groupName: string,
    optionName: string,
  ): boolean {
    return selection.options.some((o) => o.groupName === groupName && o.optionName === optionName);
  }

  private calculateOptionsPrice(
    product: Product | undefined,
    selectedOptions: OrderItemOption[],
  ): number {
    if (!product || !product.optionGroups || selectedOptions.length === 0) {
      return 0;
    }

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
        price += Math.round(product.basePrice * (selOpt.priceModifier / 100));
      } else {
        price += selOpt.priceModifier;
      }
    });
    return price;
  }

  updateItemPrice(itemIndex: number) {
    const item = this.orderData.items[itemIndex];
    let newPrice = 0;

    if (item.itemType === 'Product') {
      const product = this.getProduct(item.item);
      newPrice = (product?.basePrice || 0) + this.calculateOptionsPrice(product, item.options);
    } else if (item.itemType === 'Combo') {
      const combo = this.getCombo(item.item);
      if (combo) {
        const allSelections = item.comboSelections;

        // 1. Tính giá Combo CƠ BẢN
        if (combo.pricingMode === ComboPricingMode.FIXED) {
          newPrice = combo.comboPrice;
        } else if (combo.pricingMode === ComboPricingMode.SLOT_PRICE) {
          newPrice = allSelections.reduce((sum, sel) => {
            const productId = typeof sel.product === 'string' ? sel.product : sel.product.id;
            const slot = combo.items.find((s) => s.slotName === sel.slotName);

            const prodInfo = slot?.selectableProducts.find((p) => p.product === productId);
            return sum + (prodInfo?.slotPrice || 0);
          }, 0);
        } else if (combo.pricingMode === ComboPricingMode.DISCOUNT) {
          const baseTotal = allSelections.reduce((sum, sel) => {
            const productId = typeof sel.product === 'string' ? sel.product : sel.product.id;
            const slot = combo.items.find((s) => s.slotName === sel.slotName);

            const prodInfo = slot?.selectableProducts.find((p) => p.product === productId);
            return sum + (prodInfo?.snapshotPrice || 0);
          }, 0);

          if (combo.discountType === DiscountType.PERCENT) {
            newPrice = baseTotal * (1 - (combo.discountValue || 0) / 100);
          } else if (combo.discountType === DiscountType.AMOUNT) {
            newPrice = Math.max(0, baseTotal - (combo.discountValue || 0));
          } else {
            newPrice = baseTotal;
          }
        }

        // 2. Cộng gộp PHỤ THU (additionalPrice)
        const totalAdditional = allSelections.reduce((sum, sel) => {
          const productId = typeof sel.product === 'string' ? sel.product : sel.product.id;
          const slot = combo.items.find((s) => s.slotName === sel.slotName);
          const prodInfo = slot?.selectableProducts.find((p) => p.product === productId);
          return sum + (prodInfo?.additionalPrice || 0);
        }, 0);
        newPrice += totalAdditional;

        // 3. Cộng gộp GIÁ OPTIONS
        const totalOptionsPrice = allSelections.reduce((sum, sel) => {
          const productId = typeof sel.product === 'string' ? sel.product : sel.product.id;
          const product = this.getProduct(productId);
          return sum + this.calculateOptionsPrice(product, sel.options);
        }, 0);
        newPrice += totalOptionsPrice;
      }
    }

    item.price = newPrice;
    this.calculateTotals();
  }

  calculateTotals() {
    this.orderData.totalAmount = this.orderData.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price;
      return sum + price * item.quantity;
    }, 0);

    let discount = 0;
    const discountValue =
      typeof this.orderData.discountValue === 'string'
        ? parseFloat(this.orderData.discountValue) || 0
        : this.orderData.discountValue;

    if (this.orderData.discountType === 'percentage') {
      discount = (this.orderData.totalAmount * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    const shipping =
      typeof this.orderData.shippingFee === 'string'
        ? parseFloat(this.orderData.shippingFee) || 0
        : this.orderData.shippingFee;

    this.orderData.grandTotal = this.orderData.totalAmount - discount + shipping;
  }

  validateForm(): boolean {
    if (this.orderData.items.length === 0) {
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

      // Validation Options
      if (item.itemType === 'Product') {
        const product = this.getProduct(item.item);
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
      // Validation Combo
      else if (item.itemType === 'Combo') {
        const combo = this.getCombo(item.item);
        if (!combo) continue;

        for (const slot of combo.items) {
          const selectionCount = item.comboSelections.filter(
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

          const selectionsInSlot = item.comboSelections.filter((s) => s.slotName === slot.slotName);
          for (const sel of selectionsInSlot) {
            const productId = typeof sel.product === 'string' ? sel.product : sel.product.id;
            const product = this.getProduct(productId);

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
      if (
        !this.orderData.shipping?.address?.recipientName ||
        !this.orderData.shipping?.address?.recipientPhone ||
        !this.orderData.shipping?.address?.street ||
        !this.orderData.shipping?.address?.city
      ) {
        this.toastr.error('Please fill in all required shipping fields', 'Validation Error');
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

    this.calculateTotals();
    const payload: any = deepSanitize(this.orderData, DEFAULT_FORM);

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
