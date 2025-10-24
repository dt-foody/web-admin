import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BlogPost } from '../../models/blog-post.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class BlogPostService extends BaseService<BlogPost> {
  constructor(http: HttpClient) {
    super(http, 'blog-posts');
  }
}
