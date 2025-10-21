import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ThemeToggleTwoComponent } from '../../components/common/theme-toggle-two/theme-toggle-two.component';

@Component({
  selector: 'app-auth-page-layout',
  imports: [RouterModule, ThemeToggleTwoComponent],
  templateUrl: './auth-page-layout.component.html',
  styles: ``,
})
export class AuthPageLayoutComponent {}
