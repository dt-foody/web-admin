import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';

// Import UI Components
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';

// Import Models & Services
import { Permission } from '../../../../models/permission.model';
import { Role } from '../../../../models/role.model';
import { EmployeeFormData } from '../../../../models/employee.model'; // Interface mới cập nhật
import { PermissionService } from '../../../../services/api/permission.service';
import { RoleService } from '../../../../services/api/role.service';
import { EmployeeService } from '../../../../services/api/employee.service';

interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-employee-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './employee-add.component.html',
})
export class EmployeeAddComponent implements OnInit {
  employeeId: string | null = null;
  isEditMode: boolean = false;
  currentTab: 'profile' | 'account' = 'profile';

  setTab(tab: 'profile' | 'account') {
    this.currentTab = tab;
  }

  // [CẬP NHẬT] Khởi tạo data theo cấu trúc Nested
  employeeData: EmployeeFormData = {
    // Employee Info
    name: '',
    gender: 'male',
    birthDate: '',
    emails: [{ value: '', type: 'Company' }],
    phones: [{ value: '', type: 'Mobile' as any }],
    addresses: [],

    // User Info (Nested Object)
    user: {
      email: '',
      password: '',
      role: 'staff',
      roles: [],
      isActive: true,
      isEmailVerified: false,
      extraPermissions: [],
      excludePermissions: [],
    },
  };

  // UI Helpers
  showPassword: boolean = false;

  // Data Sources
  roles: Role[] = [];
  allPermissions: Permission[] = [];
  permissionGroups: PermissionGroup[] = [];

  // Options cho Select Box
  systemRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' },
    { value: 'guest', label: 'Guest' },
  ];

  genderOptions = [
    { value: 'male', label: 'Nam' },
    { value: 'female', label: 'Nữ' },
    { value: 'other', label: 'Khác' },
  ];

  contactTypes = [
    { value: 'Company', label: 'Công ty' },
    { value: 'Home', label: 'Nhà riêng' },
    { value: 'Other', label: 'Khác' },
  ];

  phoneTypes = [
    { value: 'Mobile', label: 'Di động' },
    { value: 'Work', label: 'Cơ quan' },
    { value: 'Home', label: 'Nhà riêng' },
    { value: 'Fax', label: 'Fax' },
    { value: 'Other', label: 'Khác' },
  ];

  // Computed State
  effectivePermissions: Set<string> = new Set();
  rolePermissions: Set<string> = new Set();
  customRolePermissions: Set<string> = new Set();
  expandedGroups: Set<string> = new Set();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private employeeService: EmployeeService,
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.loadRoles();
    this.loadPermissions();

    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.employeeId = id;
        this.loadEmployee(id);
      }
    });
  }

  // --- LOAD DATA ---

  loadEmployee(id: string) {
    this.employeeService.getById(id, { populate: 'user' }).subscribe({
      next: (data: any) => {
        // 1. Map thông tin Employee cơ bản
        this.employeeData.name = data.name;
        this.employeeData.gender = data.gender || 'male';
        this.employeeData.birthDate = data.birthDate
          ? new Date(data.birthDate).toISOString().split('T')[0]
          : '';
        this.employeeData.emails = data.emails || [];
        this.employeeData.phones = data.phones || [];
        this.employeeData.addresses = data.addresses || [];

        // 2. Map thông tin User (Xử lý populate)
        // Kiểm tra xem backend trả về object user lồng nhau hay phẳng
        const userInfo = data.user || {};

        this.employeeData.user = {
          email: userInfo.email || '', // Fallback nếu API cũ
          role: userInfo.role || 'staff',
          roles: userInfo.roles?.map((r: any) => r.id || r) || [],
          isActive: userInfo.isActive ?? true,
          isEmailVerified: userInfo.isEmailVerified ?? false,
          // Giữ password rỗng khi edit
          password: '',

          // Map permissions
          extraPermissions: userInfo.extraPermissions?.map((p: any) => p.id || p) || [],
          excludePermissions: userInfo.excludePermissions?.map((p: any) => p.id || p) || [],
        };

        this.calculateEffectivePermissions();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Không thể tải thông tin nhân viên', 'Lỗi');
      },
    });
  }

  loadRoles() {
    this.roleService.getAll({ limit: 1000 }).subscribe({
      next: (res) => (this.roles = res.results || []),
      error: (err) => console.error(err),
    });
  }

  loadPermissions() {
    this.permissionService.getAll({ limit: 1000 }).subscribe({
      next: (res) => {
        this.allPermissions = res.results || [];
        this.groupPermissionsByResource();
      },
      error: (err) => console.error(err),
    });
  }

  // --- DYNAMIC LIST HANDLERS ---

  addEmail() {
    this.employeeData.emails.push({ value: '', type: 'Company' });
  }
  removeEmail(index: number) {
    this.employeeData.emails.splice(index, 1);
  }

  addPhone() {
    this.employeeData.phones.push({ value: '', type: 'Mobile' as any });
  }
  removePhone(index: number) {
    this.employeeData.phones.splice(index, 1);
  }

  addAddress() {
    this.employeeData.addresses.push({
      label: 'Nhà riêng',
      recipientName: this.employeeData.name,
      recipientPhone: this.employeeData.phones[0]?.value || '',
      street: '',
      ward: '',
      district: '',
      city: '',
      isDefault: false,
    });
  }
  removeAddress(index: number) {
    this.employeeData.addresses.splice(index, 1);
  }

  // --- PERMISSION LOGIC (Updated for Nested User) ---

  groupPermissionsByResource() {
    const grouped = new Map<string, Permission[]>();
    this.allPermissions.forEach((perm) => {
      if (!grouped.has(perm.resource)) grouped.set(perm.resource, []);
      grouped.get(perm.resource)!.push(perm);
    });
    this.permissionGroups = Array.from(grouped.entries()).map(([resource, permissions]) => ({
      resource,
      permissions: permissions.sort((a, b) => a.action.localeCompare(b.action)),
    }));
  }

  calculateEffectivePermissions() {
    this.rolePermissions.clear();
    this.customRolePermissions.clear();
    this.effectivePermissions.clear();

    // [CẬP NHẬT] Truy cập roles từ user object
    this.employeeData.user?.roles.forEach((roleId) => {
      const role = this.roles.find((r) => r.id === roleId);
      if (role?.permissions) {
        role.permissions.forEach((perm: any) => {
          const permId = typeof perm === 'string' ? perm : perm.id;
          this.customRolePermissions.add(permId);
        });
      }
    });

    // Combine base permissions
    const basePermissions = new Set([...this.rolePermissions, ...this.customRolePermissions]);

    // [CẬP NHẬT] Add Extra từ user object
    this.employeeData.user?.extraPermissions.forEach((permId) => basePermissions.add(permId));

    // [CẬP NHẬT] Remove Exclude từ user object
    basePermissions.forEach((permId) => {
      if (!this.employeeData.user?.excludePermissions.includes(permId)) {
        this.effectivePermissions.add(permId);
      }
    });
  }

  onCustomRolesChange() {
    this.calculateEffectivePermissions();
  }

  togglePermission(permissionId: string, type: 'extra' | 'exclude') {
    // [CẬP NHẬT] Trỏ vào user object
    const targetArray =
      (type === 'extra'
        ? this.employeeData.user?.extraPermissions
        : this.employeeData.user?.excludePermissions) || [];
    const oppositeArray =
      (type === 'extra'
        ? this.employeeData.user?.excludePermissions
        : this.employeeData.user?.extraPermissions) || [];

    const index = targetArray.indexOf(permissionId);
    if (index > -1) {
      targetArray.splice(index, 1);
    } else {
      targetArray.push(permissionId);
      const oppIndex = oppositeArray.indexOf(permissionId);
      if (oppIndex > -1) oppositeArray.splice(oppIndex, 1);
    }
    this.calculateEffectivePermissions();
  }

  // Helpers
  isPermissionInRoles(id: string) {
    return this.rolePermissions.has(id) || this.customRolePermissions.has(id);
  }
  isPermissionExtra(id: string) {
    return this.employeeData.user?.extraPermissions.includes(id);
  }
  isPermissionExcluded(id: string) {
    return this.employeeData.user?.excludePermissions.includes(id);
  }
  isPermissionEffective(id: string) {
    return this.effectivePermissions.has(id);
  }

  countPermissionInRoles(group: PermissionGroup) {
    return group.permissions.filter((p) => this.isPermissionInRoles(p.id)).length;
  }

  toggleGroup(resource: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.expandedGroups.has(resource)
      ? this.expandedGroups.delete(resource)
      : this.expandedGroups.add(resource);
  }
  isGroupExpanded(resource: string) {
    return this.expandedGroups.has(resource);
  }

  // --- SUBMIT ---

  validateForm(): boolean {
    if (!this.employeeData.name.trim()) {
      this.toastr.error('Họ tên là bắt buộc');
      return false;
    }
    // [CẬP NHẬT] Validate email user
    // if (!this.employeeData.user.email.trim()) {
    //   this.toastr.error('Email đăng nhập là bắt buộc');
    //   return false;
    // }
    // if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.employeeData.user.email)) {
    //   this.toastr.error('Email không hợp lệ');
    //   return false;
    // }

    // [CẬP NHẬT] Password check
    // if (!this.isEditMode && !this.employeeData.user.password) {
    //   this.toastr.error('Mật khẩu là bắt buộc cho tài khoản mới');
    //   return false;
    // }
    // if (this.employeeData.user.password && this.employeeData.user.password.length < 6) {
    //   this.toastr.error('Mật khẩu quá ngắn');
    //   return false;
    // }

    return true;
  }

  onSubmit() {
    if (!this.validateForm()) return;

    // Chuẩn bị Payload
    const payload: EmployeeFormData = {
      ...this.employeeData,
      // Clean arrays
      emails: this.employeeData.emails.filter((e) => e.value),
      phones: this.employeeData.phones.filter((p) => p.value),
      // Xử lý User: nếu password rỗng thì xóa khỏi payload (để không override khi edit)
      user: this.employeeData.user?.email
        ? {
            ...this.employeeData.user,
            password: this.employeeData.user?.password || undefined,
          }
        : undefined,
    };

    const obs =
      this.isEditMode && this.employeeId
        ? this.employeeService.update(this.employeeId, payload)
        : this.employeeService.create(payload);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Cập nhật thành công!' : 'Tạo nhân viên thành công!',
          'Thành công',
        );
        this.router.navigateByUrl('/employee');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err.error?.message || 'Có lỗi xảy ra', 'Lỗi');
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/employee');
  }
}
