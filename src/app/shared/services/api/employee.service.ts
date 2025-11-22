import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Employee } from '../../models/employee.model';
import { BaseService } from './_base.service';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends BaseService<Employee> {
  constructor(http: HttpClient) {
    super(http, 'employees');
  }
}
