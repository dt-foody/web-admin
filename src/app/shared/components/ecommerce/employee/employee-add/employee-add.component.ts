import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';

// Import các component UI của bạn
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';

// Import Models & Services
import { Permission } from '../../../../models/permission.model';
import { Role } from '../../../../models/role.model';
import {
  EmployeeFormData,
  EmployeeAddress,
  EmployeeEmail,
  EmployeePhone,
} from '../../../../models/employee.model';
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

  // Trong class EmployeeAddComponent
  currentTab: 'profile' | 'account' = 'profile';

  setTab(tab: 'profile' | 'account') {
    this.currentTab = tab;
  }

  // Khởi tạo data mặc định
  employeeData: EmployeeFormData = {
    // Basic
    name: '',
    gender: 'male',
    birthDate: '',

    // Contact Lists
    emails: [{ value: '', type: 'Company' }], // Mặc định có 1 dòng
    phones: [{ value: '', type: 'Mobile' as any }],

    // Address List
    addresses: [],

    // Account / Auth
    role: 'staff',
    roles: [], // Custom roles IDs
    isActive: true,
    isEmailVerified: false,
    // Password (optional for edit)
    // email (account email) -> thường lấy từ emails[0] hoặc field riêng, ở đây ta dùng field riêng trong form
  } as any; // Cast any để xử lý linh hoạt password field

  // Field riêng cho Account Email (đăng nhập)
  accountEmail: string = '';
  accountPassword: string = '';

  // Data lists
  roles: Role[] = [];
  allPermissions: Permission[] = [];
  permissionGroups: PermissionGroup[] = [];

  // Options
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

  // Computed permissions
  effectivePermissions: Set<string> = new Set();
  rolePermissions: Set<string> = new Set();
  customRolePermissions: Set<string> = new Set();

  // UI state
  expandedGroups: Set<string> = new Set();
  showPassword: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService,
    private employeeService: EmployeeService,
    private roleService: RoleService,
    private permissionService: PermissionService,
  ) {
    // Init permission arrays
    this.employeeData.extraPermissions = [];
    this.employeeData.excludePermissions = [];
  }

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
    this.employeeService.getById(id).subscribe({
      next: (data) => {
        // Map data từ API vào Form
        this.employeeData = {
          name: data.name,
          gender: data.gender || 'male',
          birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',

          emails: data.emails && data.emails.length > 0 ? data.emails : [],
          phones: data.phones && data.phones.length > 0 ? data.phones : [],
          addresses: data.addresses || [],

          // Auth info (giả sử API trả về flattened hoặc nested trong user)
          role: (data as any).role || 'staff', // Check structure thực tế
          roles: data.roles?.map((r: any) => r.id || r) || [],
          extraPermissions: data.extraPermissions?.map((p: any) => p.id || p) || [],
          excludePermissions: data.excludePermissions?.map((p: any) => p.id || p) || [],
        } as any;

        // Set account specific info
        this.accountEmail = (data as any).email || ''; // Email dùng để login
        this.employeeData.isActive = (data as any).isActive;
        this.employeeData.isEmailVerified = (data as any).isEmailVerified;

        this.calculateEffectivePermissions();
      },
      error: (err) => {
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

  // --- DYNAMIC LIST HANDLERS (EMAILS, PHONES, ADDRESSES) ---

  addEmail() {
    this.employeeData.emails.push({ value: '', type: 'Company' });
  }
  removeEmail(index: number) {
    this.employeeData.emails.splice(index, 1);
  }

  addPhone() {
    this.employeeData.phones.push({ value: '', type: 'Company' });
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

  // --- PERMISSION LOGIC (Giữ nguyên logic tốt của bạn) ---

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

    // Logic tính toán custom roles
    this.employeeData.roles.forEach((roleId) => {
      const role = this.roles.find((r) => r.id === roleId);
      if (role?.permissions) {
        role.permissions.forEach((perm: any) => {
          const permId = typeof perm === 'string' ? perm : perm.id;
          this.customRolePermissions.add(permId);
        });
      }
    });

    // Combine
    const basePermissions = new Set([...this.rolePermissions, ...this.customRolePermissions]);

    // Add Extra
    this.employeeData.extraPermissions.forEach((permId) => basePermissions.add(permId));

    // Remove Exclude
    basePermissions.forEach((permId) => {
      if (!this.employeeData.excludePermissions.includes(permId)) {
        this.effectivePermissions.add(permId);
      }
    });
  }

  onRoleChange() {
    this.calculateEffectivePermissions();
  } // System role change logic (if any)
  onCustomRolesChange(roleIds: string[]) {
    this.employeeData.roles = roleIds;
    this.calculateEffectivePermissions();
  }

  togglePermission(permissionId: string, type: 'extra' | 'exclude') {
    const targetArray =
      type === 'extra' ? this.employeeData.extraPermissions : this.employeeData.excludePermissions;
    const oppositeArray =
      type === 'extra' ? this.employeeData.excludePermissions : this.employeeData.extraPermissions;

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

  // Helper functions for template
  isPermissionInRoles(id: string) {
    return this.rolePermissions.has(id) || this.customRolePermissions.has(id);
  }
  isPermissionExtra(id: string) {
    return this.employeeData.extraPermissions.includes(id);
  }
  isPermissionExcluded(id: string) {
    return this.employeeData.excludePermissions.includes(id);
  }
  isPermissionEffective(id: string) {
    return this.effectivePermissions.has(id);
  }

  countPermissionInRoles(group: PermissionGroup) {
    return group.permissions.filter((p) => this.isPermissionInRoles(p.id)).length;
  }
  countPermissionEffective(group: PermissionGroup) {
    return group.permissions.filter((p) => this.isPermissionEffective(p.id)).length;
  }

  getPermissionStatus(id: string) {
    if (this.isPermissionExcluded(id)) return 'excluded';
    if (this.isPermissionExtra(id)) return 'extra';
    if (this.isPermissionInRoles(id)) return 'role';
    return 'none';
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
    if (!this.accountEmail.trim()) {
      this.toastr.error('Email đăng nhập là bắt buộc');
      return false;
    }
    // Validate account email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.accountEmail)) {
      this.toastr.error('Email không hợp lệ');
      return false;
    }

    // Password check
    if (!this.isEditMode && !this.accountPassword) {
      this.toastr.error('Mật khẩu là bắt buộc cho tài khoản mới');
      return false;
    }
    if (this.accountPassword && this.accountPassword.length < 6) {
      this.toastr.error('Mật khẩu quá ngắn');
      return false;
    }

    return true;
  }

  onSubmit() {
    if (!this.validateForm()) return;

    // Chuẩn bị payload kết hợp Employee và User Info
    const payload = {
      ...this.employeeData,
      email: this.accountEmail, // Email đăng nhập chính
      password: this.accountPassword || undefined, // Chỉ gửi nếu có nhập

      // Ensure arrays are clean
      emails: this.employeeData.emails.filter((e) => e.value),
      phones: this.employeeData.phones.filter((p) => p.value),
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
