import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/api/auth.service';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermissions = route.data['permissions'] as string[];

    if (!requiredPermissions?.length) return true; // Không yêu cầu quyền

    const userPermissions = this.auth.getPermissions();

    const hasPermission = requiredPermissions.some((p: string) => userPermissions.includes(p));

    if (!hasPermission) {
      this.router.navigate(['/forbidden']);
      return false;
    }

    return true;
  }
}
