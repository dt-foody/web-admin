import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { ConditionsBuilderComponent } from '../../../form/conditions-builder/conditions-builder.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { SwitchComponent } from '../../../form/input/switch.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { ComponentCardComponent } from '../../../common/component-card/component-card.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';
import { LabelComponent } from '../../../form/label/label.component';

// Services & Models
import { ShippingSettingService } from '../../../../services/api/shipping-setting.service';
import { ShippingSetting } from '../../../../models/shipping-setting.model';
import { ConditionGroup, Field, Operator } from '../../../../models/conditions.model';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { of } from 'rxjs';

@Component({
  selector: 'app-shipping-setting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConditionsBuilderComponent,
    ButtonComponent,
    SwitchComponent,
    InputFieldComponent,
    ComponentCardComponent,
    TextAreaComponent,
    LabelComponent,
    HasPermissionDirective,
  ],
  templateUrl: './shipping-setting.component.html',
})
export class ShippingSettingComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isSaving = false;
  currentSettingId: string | null = null;

  // The root condition group state, managed by the parent component
  rootGroup: WritableSignal<ConditionGroup> = signal<ConditionGroup>({
    id: 'root',
    operator: 'AND',
    conditions: [],
  });

  // Define fields for shipping conditions
  fields: Field[] = [
    {
      id: 'order_total_amount',
      group: 'Đơn hàng',
      name: 'Tổng giá trị đơn hàng',
      type: 'number',
      operators: [Operator.GREATER_THAN, Operator.LESS_THAN, Operator.BETWEEN, Operator.EQUALS],
    },
    {
      id: 'order_total_items',
      group: 'Đơn hàng',
      name: 'Tổng số lượng sản phẩm',
      type: 'number',
      operators: [Operator.GREATER_THAN, Operator.LESS_THAN, Operator.EQUALS],
    },
    {
      id: 'customer_default_address_district',
      group: 'Địa chỉ Mặc Định',
      name: 'Quận/Huyện',
      type: 'multi-select',
      operators: [Operator.IN, Operator.NOT_IN],
      source: {
        valueField: 'label',
        labelField: 'label',
        optionsLoader: (params: any) => {
          const districts = [
            { label: 'Quận Ba Đình' },
            { label: 'Quận Cầu Giấy' },
            { label: 'Quận Đống Đa' },
            { label: 'Quận Hai Bà Trưng' },
            { label: 'Quận Hoàn Kiếm' },
            { label: 'Quận Thanh Xuân' },
            { label: 'Quận Hoàng Mai' },
            { label: 'Quận Long Biên' },
            { label: 'Quận Hà Đông' },
            { label: 'Quận Tây Hồ' },
            { label: 'Quận Nam Từ Liêm' },
            { label: 'Quận Bắc Từ Liêm' },
          ];

          let filtered = districts;
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            filtered = districts.filter((d) => d.label.toLowerCase().includes(searchLower));
          }

          return of({
            results: filtered,
            page: 1,
            limit: 100,
            totalPages: 1,
            totalResults: filtered.length,
          });
        },
      },
    },
    {
      id: 'current_day_of_week',
      group: 'Thứ ngày',
      name: 'Thứ trong tuần',
      type: 'multi-select',
      operators: [Operator.IN, Operator.NOT_IN],
      source: {
        valueField: 'id',
        labelField: 'label',
        optionsLoader: (params: any) => {
          const days = [
            { id: 1, label: 'Thứ 2' },
            { id: 2, label: 'Thứ 3' },
            { id: 3, label: 'Thứ 4' },
            { id: 4, label: 'Thứ 5' },
            { id: 5, label: 'Thứ 6' },
            { id: 6, label: 'Thứ 7' },
            { id: 0, label: 'Chủ Nhật' },
          ];

          let filtered = days;
          if (params.search) {
            const searchLower = params.search.toLowerCase();
            filtered = days.filter((d) => d.label.toLowerCase().includes(searchLower));
          }

          return of({
            results: filtered,
            page: 1,
            limit: 100,
            totalPages: 1,
            totalResults: filtered.length,
          });
        },
      },
    },
    {
      id: 'current_full_date',
      group: 'Thứ ngày',
      name: 'Ngày hiện tại',
      type: 'date',
      operators: [Operator.EQUALS],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private shippingService: ShippingSettingService,
    private toastr: ToastrService,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      priority: [0, [Validators.required, Validators.min(0)]],
      fixedFee: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      description: [''],
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    this.shippingService.getAll({ limit: 1, sortBy: 'priority:desc' }).subscribe({
      next: (res: any) => {
        if (res.results && res.results.length > 0) {
          const setting = res.results[0];
          this.currentSettingId = setting.id;
          this.form.patchValue({
            name: setting.name,
            priority: setting.priority,
            fixedFee: setting.fixedFee,
            isActive: setting.isActive,
            description: setting.description,
          });

          if (setting.conditions) {
            this.rootGroup.set(setting.conditions);
          }
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading shipping settings:', err);
        this.toastr.error('Unable to load shipping settings');
        this.isLoading = false;
      },
    });
  }

  onSave() {
    if (this.form.invalid) {
      this.toastr.error('Please fill in all required fields correctly.');
      return;
    }

    this.isSaving = true;
    const formValue = this.form.value;

    // Explicitly using any to avoid type issues if models are strict
    const payload: any = {
      ...formValue,
      conditions: this.rootGroup(),
    };

    const request = this.currentSettingId
      ? this.shippingService.update(this.currentSettingId, payload)
      : this.shippingService.create(payload);

    request.subscribe({
      next: (res: any) => {
        if (!this.currentSettingId && res.id) {
          this.currentSettingId = res.id;
        }
        this.toastr.success('Shipping settings saved successfully!');
        this.isSaving = false;
      },
      error: (err: any) => {
        console.error('Error saving shipping settings:', err);
        this.toastr.error('Failed to save shipping settings.');
        this.isSaving = false;
      },
    });
  }
}
