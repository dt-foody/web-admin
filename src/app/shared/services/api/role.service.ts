import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../../models/role.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class RoleService extends BaseService<Role> {
  constructor(http: HttpClient) {
    super(http, 'roles');
  }
}
