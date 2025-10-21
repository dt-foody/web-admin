import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../../models/product.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends BaseService<Product> {
  constructor(http: HttpClient) {
    super(http, 'products');
  }
}
