import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PricePromotion } from '../../models/price-promotion.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class PricePromotionService extends BaseService<PricePromotion> {
  constructor(http: HttpClient) {
    super(http, 'price-promotions');
  }
}
