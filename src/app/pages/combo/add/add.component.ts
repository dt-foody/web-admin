import { Component } from '@angular/core';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { ComboAddComponent } from '../../../shared/components/ecommerce/combo/combo-add/combo-add.component';

@Component({
  selector: 'app-add-[combo]',
  imports: [PageBreadcrumbComponent, ComboAddComponent],
  templateUrl: './add.component.html',
  styles: ``,
})
export class AddComboPageComponent {}
