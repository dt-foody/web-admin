import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../services/api/auth.service';

@Directive({
  selector: '[hasPermission]',
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
  set hasPermission(perms: string | string[]) {
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
