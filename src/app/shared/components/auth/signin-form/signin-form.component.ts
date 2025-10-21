import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/api/auth.service';
import { catchError } from 'rxjs';
import { of } from 'rxjs';

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
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

  email = '';
  password = '';
  errorMessage = ''; // dùng hiển thị thông báo lỗi

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    this.errorMessage = ''; // reset thông báo lỗi
    this.authService
      .login(this.email, this.password)
      .pipe(
        catchError((err) => {
          // Xử lý lỗi từ server
          this.errorMessage = err.error?.message || 'Đăng nhập thất bại';
          return of(null); // trả về observable để không crash
        }),
      )
      .subscribe((data) => {
        if (data) {
          // Thành công -> chuyển hướng đến dashboard hoặc trang chính
          this.router.navigate(['/']); // thay '/dashboard' theo route của bạn
        }
      });
  }
}
