import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  DEFAULT_FORM,
  Order,
  OrderFormData,
  OrderItem,
  OrderItemComboSelection,
  OrderItemOption,
} from '../../models/order.model';
import { BaseService } from './_base.service';
import { catchError } from 'rxjs';

import { deepSanitize } from '../../utils/form-data.utils';
import { Product } from '../../models/product.model';
import { Combo } from '../../models/combo.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService extends BaseService<Order> {
  constructor(http: HttpClient) {
    super(http, 'orders');
  }

  adminCreateOrder(body: any) {
    return this.http
      .post<Order>(`${this.apiUrl}/admin-order`, body)
      .pipe(catchError(this.handleError));
  }

  adminUpdateOrder(id: string, body: any) {
    return this.http
      .patch<any>(`${this.apiUrl}/admin-order/${id}`, body)
      .pipe(catchError(this.handleError));
  }

  // =================================================================
  // LOGIC BUILD PAYLOAD DÙNG CHUNG (Được chuyển từ OrderAddComponent)
  // =================================================================

  /**
   * Xây dựng payload cuối cùng để gửi lên API (admin-order hoặc pos-order)
   * @param orderData Dữ liệu thô từ form (OrderFormData)
   * @param products Danh sách đầy đủ products (để tra cứu)
   * @param combos Danh sách đầy đủ combos (để tra cứu)
   * @returns Payload đã được map
   */
  public buildAdminOrderPayload(
    orderData: OrderFormData,
    products: Product[],
    combos: Combo[],
  ): any {
    // Tính lại totals
    const totalAmount = orderData.items.reduce((sum, item) => {
      const price = typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
      return sum + price * (item.quantity || 0);
    }, 0);

    const discountValue =
      typeof orderData.discountValue === 'string'
        ? parseFloat(orderData.discountValue) || 0
        : orderData.discountValue || 0;

    let discount = 0;
    if (orderData.discountType === 'percentage') {
      discount = (totalAmount * discountValue) / 100;
    } else {
      discount = discountValue;
    }

    const shipping =
      typeof orderData.shippingFee === 'string'
        ? parseFloat(orderData.shippingFee) || 0
        : orderData.shippingFee || 0;

    const grandTotal = totalAmount - discount + shipping;

    // ---

    const base: any = deepSanitize(orderData, DEFAULT_FORM);

    // Map items -> schema backend
    base.items = orderData.items.map((it) => this.mapOrderItemForApi(it, products, combos));

    base.totalAmount = totalAmount;
    base.grandTotal = grandTotal;
    base.discountAmount = discount;
    base.status = "confirmed";

    delete base.discountType;
    delete base.discountValue;

    // Profile type
    if (base.profile) base.profileType = 'Customer';
    else base.profileType = null;

    // coupons
    if (!base.coupons) base.coupons = [];

    return base;
  }

  // ===== CÁC HÀM PRIVATE HỖ TRỢ (Copy từ OrderAddComponent) =====

  private getProductById(id: string | null | undefined, products: Product[]): Product | undefined {
    if (!id) return undefined;
    return products.find((p) => p.id === id);
  }

  private getComboById(id: string | null | undefined, combos: Combo[]): Combo | undefined {
    if (!id) return undefined;
    return combos.find((c) => c.id === id);
  }

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
    products: Product[],
    combos: Combo[],
  ): Product | undefined {
    if (!comboId) return this.getProductById(productId, products);

    const combo = this.getComboById(comboId, combos);
    if (!combo) return this.getProductById(productId, products);

    const slot = combo.items.find((s) => s.slotName === slotName);
    if (!slot) return this.getProductById(productId, products);

    const sp = slot.selectableProducts.find((p: any) => {
      const prod: any = p.product;
      const pid = typeof prod === 'string' ? prod : prod?.id;
      return pid === productId;
    });

    if (!sp) return this.getProductById(productId, products);

    const prodObj: any = sp.product;
    if (typeof prodObj === 'object') return prodObj as Product;

    return this.getProductById(prodObj, products);
  }

  private mapComboSelectionForApi(
    orderItem: OrderItem,
    sel: OrderItemComboSelection,
    products: Product[],
    combos: Combo[],
  ) {
    const comboId = orderItem.item as string;
    const selProdId = typeof sel.product === 'string' ? sel.product : (sel.product as any)?.id;

    const prod = this.findProductForComboSelection(
      comboId,
      sel.slotName,
      selProdId,
      products,
      combos,
    );

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

  private mapOrderItemForApi(item: OrderItem, products: Product[], combos: Combo[]): any {
    const quantity = item.quantity || 0;
    const unitPrice =
      typeof item.price === 'string' ? parseFloat(item.price) || 0 : item.price || 0;
    const totalPrice = unitPrice * quantity;

    if (item.itemType === 'Combo') {
      const combo = this.getComboById(item.item as string, combos);

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
          this.mapComboSelectionForApi(item, sel, products, combos),
        ),
        quantity,
        note: item.note || '',
      };
    }

    // Product
    const product = this.getProductById(item.item as string, products);

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
}
