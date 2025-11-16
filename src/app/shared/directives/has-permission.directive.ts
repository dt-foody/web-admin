import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/api/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private requiredPermissions: string[] = [];

  constructor(
    private tpl: TemplateRef<any>,
    private vcr: ViewContainerRef,
    private auth: AuthService,
  ) {}

  @Input()
  set appHasPermission(perms: string | string[] | undefined | null) {
    // Nếu không yêu cầu quyền (null, undefined, rỗng), thì hiển thị
    if (
      !perms ||
      (Array.isArray(perms) && perms.length === 0) ||
      (typeof perms === 'string' && !perms.trim())
    ) {
      this.vcr.clear();
      this.vcr.createEmbeddedView(this.tpl);
      return;
    }

    this.requiredPermissions = Array.isArray(perms) ? perms : [perms];
    this.updateView();
  }

  private updateView() {
    const userPerms = this.auth.getPermissions();
    const hasPerm = this.requiredPermissions.some((p) => userPerms.includes(p));

    this.vcr.clear();
    if (hasPerm) {
      this.vcr.createEmbeddedView(this.tpl);
    }
  }
}
