import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Menu } from '../../models/menu.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService extends BaseService<Menu> {
  constructor(http: HttpClient) {
    super(http, 'menu');
  }
}
