import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BlogCategory } from '../../models/blog-category.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class BlogCategoryService extends BaseService<BlogCategory> {
  constructor(http: HttpClient) {
    super(http, 'blog-categories');
  }
}
