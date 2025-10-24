import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Permission } from '../../../../models/permission.model';
import { ToastrService } from 'ngx-toastr';
import { PermissionService } from '../../../../services/api/permission.service';
import { RoleService } from '../../../../services/api/role.service';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { CheckboxComponent } from '../../../form/input/checkbox.component';

interface RoleForm {
  name: string;
  description: string;
  permissions: string[];
}

interface PermissionMatrix {
  resource: string;
  actions: {
    [action: string]: {
      id: string;
      checked: boolean;
      description: string;
    };
  };
}

@Component({
  selector: 'app-role-add',
  standalone: true,
  imports: [CommonModule, FormsModule, InputFieldComponent, TextAreaComponent, CheckboxComponent],
  templateUrl: './role-add.component.html',
})
export class RoleAddComponent implements OnInit {
  roleForm: RoleForm = {
    name: '',
    description: '',
    permissions: [],
  };

  availablePermissions: Permission[] = [];
  permissionMatrix: PermissionMatrix[] = [];
  allActions: string[] = ['create', 'read', 'update', 'delete'];

  isLoading = false;
  errorMessage = '';
  roleId: string | null = null;
  isEditMode: boolean = false;

  constructor(
    private router: Router,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.roleId = id;
      }
      this.loadPermissions(); // Load permissions trước, sau đó mới map role nếu edit
    });
  }

  loadRole(id: string): void {
    this.roleService.getById(id).subscribe({
      next: (data) => {
        this.roleForm = {
          name: data.name,
          description: data.description,
          permissions: data.permissions || [],
        };

        // Sau khi đã có permissionMatrix, map checked
        this.mapCheckedPermissions();
      },
      error: (err) => {
        console.error('Error loading role:', err);
        this.toastr.error('Failed to load role');
      },
    });
  }

  loadPermissions(): void {
    this.permissionService.getAll({ limit: 1000 }).subscribe({
      next: (data) => {
        this.availablePermissions = data.results;
        this.buildPermissionMatrix();

        // Nếu ở chế độ edit thì load role sau khi có permission list
        if (this.isEditMode && this.roleId) {
          this.loadRole(this.roleId);
        }
      },
      error: (err) => {
        console.log('Error loading permissions:', err);
        this.errorMessage = 'Failed to load permissions';
      },
    });
  }

  buildPermissionMatrix(): void {
    const resourceMap = new Map<string, PermissionMatrix>();

    this.availablePermissions.forEach((permission) => {
      if (!resourceMap.has(permission.resource)) {
        resourceMap.set(permission.resource, {
          resource: permission.resource,
          actions: {},
        });
      }

      const matrix = resourceMap.get(permission.resource)!;
      matrix.actions[permission.action] = {
        id: permission.id,
        checked: false,
        description: permission.description || '',
      };
    });

    this.permissionMatrix = Array.from(resourceMap.values()).sort((a, b) =>
      a.resource.localeCompare(b.resource),
    );
  }

  /** Gán checked cho những permission đã có trong roleForm.permissions */
  mapCheckedPermissions(): void {
    if (!this.roleForm.permissions?.length) return;

    this.permissionMatrix.forEach((matrix) => {
      Object.values(matrix.actions).forEach((action) => {
        action.checked = this.roleForm.permissions.includes(action.id);
      });
    });
  }

  togglePermission(resource: string, action: string): void {
    const matrix = this.permissionMatrix.find((m) => m.resource === resource);
    if (matrix && matrix.actions[action]) {
      matrix.actions[action].checked = !matrix.actions[action].checked;
      this.updateSelectedPermissions();
    }
  }

  toggleRow(resource: string): void {
    const matrix = this.permissionMatrix.find((m) => m.resource === resource);
    if (matrix) {
      const allChecked = this.isRowSelected(resource);
      Object.values(matrix.actions).forEach((action) => {
        action.checked = !allChecked;
      });
      this.updateSelectedPermissions();
    }
  }

  toggleColumn(action: string): void {
    const allChecked = this.isColumnSelected(action);
    this.permissionMatrix.forEach((matrix) => {
      if (matrix.actions[action]) {
        matrix.actions[action].checked = !allChecked;
      }
    });
    this.updateSelectedPermissions();
  }

  toggleAll(): void {
    const allSelected = this.areAllSelected();
    this.permissionMatrix.forEach((matrix) => {
      Object.values(matrix.actions).forEach((action) => {
        action.checked = !allSelected;
      });
    });
    this.updateSelectedPermissions();
  }

  isRowSelected(resource: string): boolean {
    const matrix = this.permissionMatrix.find((m) => m.resource === resource);
    if (!matrix) return false;
    const actions = Object.values(matrix.actions);
    return actions.length > 0 && actions.every((a) => a.checked);
  }

  isColumnSelected(action: string): boolean {
    const matricesWithAction = this.permissionMatrix.filter((m) => m.actions[action]);
    return (
      matricesWithAction.length > 0 && matricesWithAction.every((m) => m.actions[action].checked)
    );
  }

  areAllSelected(): boolean {
    return this.permissionMatrix.every((matrix) =>
      Object.values(matrix.actions).every((a) => a.checked),
    );
  }

  clearAll(): void {
    this.permissionMatrix.forEach((matrix) => {
      Object.values(matrix.actions).forEach((action) => {
        action.checked = false;
      });
    });
    this.updateSelectedPermissions();
  }

  updateSelectedPermissions(): void {
    this.roleForm.permissions = [];
    this.permissionMatrix.forEach((matrix) => {
      Object.values(matrix.actions).forEach((action) => {
        if (action.checked) {
          this.roleForm.permissions.push(action.id);
        }
      });
    });
  }

  getSelectedCount(): number {
    return this.roleForm.permissions.length;
  }

  validateForm(): boolean {
    if (!this.roleForm.name.trim()) {
      this.errorMessage = 'Role name is required';
      return false;
    }

    if (this.roleForm.permissions.length === 0) {
      this.errorMessage = 'Please select at least one permission';
      return false;
    }

    this.errorMessage = '';
    return true;
  }

  onSave(): void {
    if (!this.validateForm()) return;

    this.isLoading = true;

    if (this.isEditMode && this.roleId) {
      // --- Update ---
      this.roleService.update(this.roleId, this.roleForm).subscribe({
        next: (data) => {
          this.toastr.success('Updated successfully!', 'Role');
          this.router.navigate(['/role']);
        },
        error: (err) => {
          console.error('Error updating role:', err);
          this.toastr.error('Update failed!', 'Role');
          this.isLoading = false;
        },
      });
    } else {
      // --- Create ---
      this.roleService.create(this.roleForm).subscribe({
        next: (data) => {
          this.toastr.success('Created successfully!', 'Role');
          this.router.navigate(['/role']);
        },
        error: (err) => {
          console.error('Error creating role:', err);
          this.toastr.error('Create failed!', 'Role');
          this.isLoading = false;
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/role']);
  }
}
