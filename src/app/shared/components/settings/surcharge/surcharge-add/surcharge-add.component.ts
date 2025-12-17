import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SurchargeService } from '../../../../services/api/surcharge.service';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { SwitchComponent } from '../../../form/input/switch.component';

@Component({
  selector: 'app-surcharge-add', // Giữ selector này dùng chung cho cả 2 page
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InputFieldComponent,
    TextAreaComponent,
    SwitchComponent,
  ],
  templateUrl: './surcharge-add.component.html',
})
export class SurchargeAddComponent implements OnInit {
  form: FormGroup;
  isSubmitting = false;

  // Các biến xử lý logic Edit
  isEditMode = false;
  id: string | null = null;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private surchargeService: SurchargeService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute, // Inject thêm route để lấy ID
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      cost: [0, [Validators.required, Validators.min(0)]],
      description: [''],
      priority: [0],
      isActive: [true],
    });
  }

  ngOnInit(): void {
    // Kiểm tra params trên URL
    this.id = this.route.snapshot.params['id'];

    if (this.id) {
      this.isEditMode = true;
      this.loadData(this.id);
    }
  }

  loadData(id: string) {
    this.isLoading = true;
    this.surchargeService.getById(id).subscribe({
      next: (data) => {
        this.form.patchValue(data);
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Không tìm thấy dữ liệu phụ thu.', 'Lỗi');
        this.router.navigate(['/settings/surcharge']);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const data = this.form.value;

    // Chọn hàm create hoặc update tùy mode
    const request$ = this.isEditMode
      ? this.surchargeService.update(this.id!, data)
      : this.surchargeService.create(data);

    request$.subscribe({
      next: () => {
        const message = this.isEditMode ? 'Cập nhật thành công!' : 'Thêm mới thành công!';
        this.toastr.success(message, 'Thành công');
        this.router.navigate(['/settings/surcharge']);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Có lỗi xảy ra.', 'Lỗi');
        this.isSubmitting = false;
      },
    });
  }
}
