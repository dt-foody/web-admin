import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer } from '../../models/customer.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends BaseService<Customer> {
  constructor(http: HttpClient) {
    super(http, 'customers');
  }
}
