// src/app/shared/components/auth/signin-form/signin-form.component.ts

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/api/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``,
})
export class SigninFormComponent {
  showPassword = false;
  isChecked = false;

  // Đổi email -> username
  username = ''; 
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.errorMessage = '';
    // Gọi API với username và password
    this.authService.login(this.username, this.password).subscribe({
      next: (data) => {
        if (data) {
          this.router.navigate(['/order']);
        }
      },
      error: (err) => {
        console.log('Err', err);
        this.errorMessage = err.error?.message || 'Đăng nhập thất bại';
        this.toastr.error(this.errorMessage);
      },
    });
  }
}
