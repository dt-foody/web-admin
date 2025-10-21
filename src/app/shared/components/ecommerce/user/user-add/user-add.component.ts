import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { ToastrService } from 'ngx-toastr';

import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';

import { Permission } from '../../../../models/permission.model';
import { Role } from '../../../../models/role.model';
import { PermissionService } from '../../../../services/api/permission.service';
import { RoleService } from '../../../../services/api/role.service';
import { UserService } from '../../../../services/api/user.service';

interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: string;
  rolesCustom: string[];
  extraPermissions: string[];
  excludePermissions: string[];
  isEmailVerified: boolean;
}

interface PermissionGroup {
  resource: string;
  permissions: Permission[];
}

@Component({
  selector: 'app-user-add',
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
  templateUrl: './user-add.component.html',
})
export class UserAddComponent implements OnInit {
  userId: string | null = null;
  isEditMode: boolean = false;

  userData: UserFormData = {
    name: '',
    email: '',
    password: '',
    role: 'guest',
    rolesCustom: [],
    extraPermissions: [],
    excludePermissions: [],
    isEmailVerified: false,
  };

  // Data lists
  roles: Role[] = [];
  allPermissions: Permission[] = [];
  permissionGroups: PermissionGroup[] = [];

  systemRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'staff', label: 'Staff' },
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
    // Inject your services here
    private userService: UserService,
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
        this.userId = id;
        this.loadUser(id);
      }
    });
  }

  loadUser(id: string) {
    // Replace with actual service call
    this.userService.getById(id).subscribe({
      next: (data) => {
        this.userData = {
          name: data.name,
          email: data.email,
          role: data.role,
          rolesCustom: data.rolesCustom?.map((r) => r.id || r) || [],
          extraPermissions: data.extraPermissions?.map((p) => p.id || p) || [],
          excludePermissions: data.excludePermissions?.map((p) => p.id || p) || [],
          isEmailVerified: data.isEmailVerified || false,
        };
        this.calculateEffectivePermissions();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load user data', 'Error');
      },
    });
  }

  loadRoles() {
    // Replace with actual service call
    this.roleService.getAll({ limit: 1000 }).subscribe({
      next: (data) => {
        this.roles = data.results || [];
      },
      error: (err) => console.error('Error loading roles:', err),
    });
  }

  loadPermissions() {
    // Replace with actual service call
    this.permissionService.getAll({ limit: 1000 }).subscribe({
      next: (data) => {
        this.allPermissions = data.results || [];
        this.groupPermissionsByResource();
      },
      error: (err) => console.error('Error loading permissions:', err),
    });

    this.groupPermissionsByResource();
  }

  groupPermissionsByResource() {
    const grouped = new Map<string, Permission[]>();

    this.allPermissions.forEach((perm) => {
      if (!grouped.has(perm.resource)) {
        grouped.set(perm.resource, []);
      }
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

    // 1. Get permissions from system role (if any)
    // In a real implementation, you'd fetch this from the backend

    // 2. Get permissions from custom roles
    this.userData.rolesCustom.forEach((roleId) => {
      const role = this.roles.find((r) => r.id === roleId);
      if (role?.permissions) {
        role.permissions.forEach((perm: any) => {
          const permId = typeof perm === 'string' ? perm : perm.id;
          this.customRolePermissions.add(permId);
        });
      }
    });

    // 3. Combine role permissions
    const basePermissions = new Set([...this.rolePermissions, ...this.customRolePermissions]);

    // 4. Add extra permissions
    this.userData.extraPermissions.forEach((permId) => {
      basePermissions.add(permId);
    });

    // 5. Remove excluded permissions
    basePermissions.forEach((permId) => {
      if (!this.userData.excludePermissions.includes(permId)) {
        this.effectivePermissions.add(permId);
      }
    });
  }

  onRoleChange() {
    this.calculateEffectivePermissions();
  }

  onCustomRolesChange(roleIds: string[]) {
    this.userData.rolesCustom = roleIds;
    this.calculateEffectivePermissions();
  }

  togglePermission(permissionId: string, type: 'extra' | 'exclude') {
    if (type === 'extra') {
      const index = this.userData.extraPermissions.indexOf(permissionId);
      if (index > -1) {
        this.userData.extraPermissions.splice(index, 1);
      } else {
        this.userData.extraPermissions.push(permissionId);
        // Remove from exclude if it exists
        const excludeIndex = this.userData.excludePermissions.indexOf(permissionId);
        if (excludeIndex > -1) {
          this.userData.excludePermissions.splice(excludeIndex, 1);
        }
      }
    } else {
      const index = this.userData.excludePermissions.indexOf(permissionId);
      if (index > -1) {
        this.userData.excludePermissions.splice(index, 1);
      } else {
        this.userData.excludePermissions.push(permissionId);
        // Remove from extra if it exists
        const extraIndex = this.userData.extraPermissions.indexOf(permissionId);
        if (extraIndex > -1) {
          this.userData.extraPermissions.splice(extraIndex, 1);
        }
      }
    }
    this.calculateEffectivePermissions();
  }

  isPermissionInRoles(permissionId: string): boolean {
    return this.rolePermissions.has(permissionId) || this.customRolePermissions.has(permissionId);
  }

  isPermissionExtra(permissionId: string): boolean {
    return this.userData.extraPermissions.includes(permissionId);
  }

  isPermissionExcluded(permissionId: string): boolean {
    return this.userData.excludePermissions.includes(permissionId);
  }

  isPermissionEffective(permissionId: string): boolean {
    return this.effectivePermissions.has(permissionId);
  }

  countPermissionInRoles(group: PermissionGroup) {
    return group.permissions.filter((p) => this.isPermissionInRoles(p.id)).length;
  }

  countPermissionEffective(group: PermissionGroup) {
    return group.permissions.filter((p) => this.isPermissionEffective(p.id)).length;
  }

  getPermissionStatus(permissionId: string): 'role' | 'extra' | 'excluded' | 'none' {
    if (this.isPermissionExcluded(permissionId)) return 'excluded';
    if (this.isPermissionExtra(permissionId)) return 'extra';
    if (this.isPermissionInRoles(permissionId)) return 'role';
    return 'none';
  }

  toggleGroup(resource: string) {
    if (this.expandedGroups.has(resource)) {
      this.expandedGroups.delete(resource);
    } else {
      this.expandedGroups.add(resource);
    }
  }

  isGroupExpanded(resource: string): boolean {
    return this.expandedGroups.has(resource);
  }

  handleSelectChange(field: keyof UserFormData, value: string) {
    if (field === 'role') {
      this.userData.role = value;
      this.onRoleChange();
    } else if (field === 'isEmailVerified') {
      this.userData.isEmailVerified = value === 'true';
    } else {
      (this.userData as any)[field] = value;
    }
  }

  validateForm(): boolean {
    if (!this.userData.name.trim()) {
      this.toastr.error('Name is required', 'Validation Error');
      return false;
    }

    if (!this.userData.email.trim()) {
      this.toastr.error('Email is required', 'Validation Error');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.userData.email)) {
      this.toastr.error('Invalid email format', 'Validation Error');
      return false;
    }

    if (!this.isEditMode && !this.userData.password) {
      this.toastr.error('Password is required for new user', 'Validation Error');
      return false;
    }

    if (this.userData.password && this.userData.password.length < 8) {
      this.toastr.error('Password must be at least 8 characters', 'Validation Error');
      return false;
    }

    if (this.userData.password && !/\d/.test(this.userData.password)) {
      this.toastr.error('Password must contain at least one number', 'Validation Error');
      return false;
    }

    if (this.userData.password && !/[a-zA-Z]/.test(this.userData.password)) {
      this.toastr.error('Password must contain at least one letter', 'Validation Error');
      return false;
    }

    return true;
  }

  onSubmit() {
    if (!this.validateForm()) return;

    const payload = {
      name: this.userData.name,
      email: this.userData.email,
      role: this.userData.role,
      rolesCustom: this.userData.rolesCustom,
      extraPermissions: this.userData.extraPermissions,
      excludePermissions: this.userData.excludePermissions,
      isEmailVerified: this.userData.isEmailVerified,
      ...(this.userData.password && { password: this.userData.password }),
    };

    // Replace with actual service call
    const obs =
      this.isEditMode && this.userId
        ? this.userService.update(this.userId, payload)
        : this.userService.create(payload);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'User updated successfully!' : 'User created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/user');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(err.error?.message || 'Operation failed', 'Error');
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/user');
  }
}
