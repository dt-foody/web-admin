import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLog } from '../../models/audit-log.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class AuditLogService extends BaseService<AuditLog> {
  constructor(http: HttpClient) {
    super(http, 'audit-logs');
  }
}
