import { Component } from '@angular/core';
import { GridShapeComponent } from '../../../shared/components/common/grid-shape/grid-shape.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [GridShapeComponent, RouterModule],
  templateUrl: './forbidden.component.html',
  styles: ``,
})
export class ForbiddenComponent {
  currentYear: number = new Date().getFullYear();
}
