import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ComponentCardComponent } from '../../../common/component-card/component-card.component';
import { SwitchComponent } from '../../../form/input/switch.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { DealSettingService } from '../../../../services/api/deal-setting.service';
import { ToastrService } from 'ngx-toastr';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-deal-setting',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SwitchComponent,
    ButtonComponent,
    ComponentCardComponent,
    HasPermissionDirective,
  ],
  templateUrl: './deal-setting.component.html',
})
export class DealSettingComponent implements OnInit {
  @Input() form!: FormGroup;

  dealSettingId = '';

  constructor(
    private dealSettingService: DealSettingService,
    private toastr: ToastrService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    // Khởi tạo form nếu chưa có
    if (!this.form) {
      this.form = this.fb.group({
        allowFastDelivery: [false],
        allowScheduledDelivery: [false],
        allowCashPayment: [false],
        allowBankTransfer: [false],
      });
    }
  }

  loadDealSetting() {
    this.dealSettingService.getAll().subscribe((result) => {
      const settings = result.results;
      if (settings.length > 0) {
        const setting = settings[0];
        this.dealSettingId = setting.id;
        this.form.patchValue(setting);
      }
    });
  }

  onSave() {
    if (this.form.invalid) {
      this.toastr.error('Vui lòng điền đầy đủ thông tin hợp lệ trước khi lưu.');
    }

    if (this.dealSettingId) {
      this.dealSettingService.update(this.dealSettingId, this.form.value).subscribe(
        (response) => {
          this.toastr.success('Cài đặt đơn hàng đã được cập nhật thành công!');
        },
        (error) => {
          this.toastr.error('Lỗi khi cập nhật cài đặt đơn hàng.');
        },
      );
    } else {
      this.dealSettingService.create(this.form.value).subscribe(
        (response) => {
          this.dealSettingId = response.id;
          this.toastr.success('Cài đặt đơn hàng đã được tạo thành công!');
        },
        (error) => {
          this.toastr.error('Lỗi khi tạo cài đặt đơn hàng.');
        },
      );
    }
  }
}
