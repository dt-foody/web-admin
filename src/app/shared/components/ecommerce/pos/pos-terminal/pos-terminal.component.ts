import { Component } from '@angular/core';
import { PosStateService } from '../../../../services/api/pos.service';
import { PosCartComponent } from '../pos-cart/pos-cart.component';
import { PosCheckoutComponent } from '../pos-checkout/pos-checkout.component';
import { PosMenuComponent } from '../pos-menu/pos-menu.component';
@Component({
  selector: 'app-pos-terminal',
  standalone: true,
  imports: [PosMenuComponent, PosCartComponent, PosCheckoutComponent],
  templateUrl: './pos-terminal.component.html',
  providers: [
    // Cung cấp "Bộ não" tại đây
    PosStateService,
  ],
})
export class PosTerminalComponent {}
