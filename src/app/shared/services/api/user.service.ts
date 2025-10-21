import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseService<User> {
  constructor(http: HttpClient) {
    super(http, 'users');
  }
}
