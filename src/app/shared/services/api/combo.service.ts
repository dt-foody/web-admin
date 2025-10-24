import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Combo } from '../../models/combo.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class ComboService extends BaseService<Combo> {
  constructor(http: HttpClient) {
    super(http, 'combos');
  }
}
