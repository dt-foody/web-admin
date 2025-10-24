import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Permission } from '../../models/permission.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService extends BaseService<Permission> {
  constructor(http: HttpClient) {
    super(http, 'permissions');
  }
}
