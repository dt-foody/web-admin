import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Category } from '../../models/category.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends BaseService<Category> {
  constructor(http: HttpClient) {
    super(http, 'categories');
  }
}
