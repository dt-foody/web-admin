import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BlogTag } from '../../models/blog-tag.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class BlogTagService extends BaseService<BlogTag> {
  constructor(http: HttpClient) {
    super(http, 'blog-tags');
  }
}
