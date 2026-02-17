import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

// Components
import { ButtonComponent } from '../../../ui/button/button.component';
import { ComponentCardComponent } from '../../../../components/common/component-card/component-card.component';
import { SwitchComponent } from '../../../form/input/switch.component';
import { TextAreaComponent } from '../../../form/input/text-area.component';

// Directives & Services
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { LayoutSettingService } from '../../../../services/api/layout-setting.service';
import { HeaderNavItem } from '../../../../models/layout-setting.model';

@Component({
  selector: 'app-layout-setting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    ComponentCardComponent,
    SwitchComponent,
    TextAreaComponent,

    HasPermissionDirective,
  ],
  templateUrl: './layout-setting.component.html',
})
export class LayoutSettingComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  isSaving = false;
  currentSettingId: string | null = null;

  // Cấu hình mặc định
  private readonly defaultItems: HeaderNavItem[] = [
    { id: 'homepage', title: 'Lưu Chi (Trang chủ)', description: '', enable: true },
    { id: 'sharing', title: 'Sharing (Chúng tôi ta)', description: '', enable: true },
    { id: 'community', title: 'Community (Ở đây)', description: '', enable: true },
    { id: 'menu', title: 'Thực đơn (Menu)', description: '', enable: true },
    { id: 'maps', title: 'Lối đi (Maps)', description: '', enable: true },
  ];

  constructor(
    private fb: FormBuilder,
    private layoutService: LayoutSettingService,
    private toastr: ToastrService,
  ) {
    // Khởi tạo form
    this.form = this.fb.group({
      items: this.fb.array([]),
      flashSale: this.createComingSoonGroup(false),
      combo: this.createComingSoonGroup(true),
    });
  }

  get itemsFormArray(): FormArray {
    return this.form.get('items') as FormArray;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    this.layoutService.getAll({ limit: 1 }).subscribe({
      next: (res) => {
        let finalItems = this.defaultItems;

        if (res.results && res.results.length > 0) {
          const setting = res.results[0];
          this.currentSettingId = setting.id;
          finalItems = this.mergeWithDefaults(setting.headerNavItems);

          // Patch value for flashSale and combo
          if (setting.flashSale) {
            this.form.get('flashSale')?.patchValue(setting.flashSale);
          }
          if (setting.combo) {
            this.form.get('combo')?.patchValue(setting.combo);
          }
        }

        // Reset form array và fill data
        this.itemsFormArray.clear();
        finalItems.forEach((item) => {
          this.itemsFormArray.push(
            this.fb.group({
              id: [item.id],
              title: [item.title],
              description: [item.description],
              enable: [item.enable],
            }),
          );
        });

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải cấu hình:', err);
        this.isLoading = false;
        this.toastr.error('Có lỗi xảy ra khi tải cấu hình.');
      },
    });
  }

  createComingSoonGroup(defaultValue: boolean) {
    return this.fb.group({
      value: [defaultValue],
      note: [''],
      activeNote: [false],
      showNoteWhen: ['off'],
    });
  }

  onSave() {
    this.isSaving = true;

    // Prepare Payload
    const payload = {
      headerNavItems: this.form.value.items,
      flashSale: this.form.value.flashSale,
      combo: this.form.value.combo,
    };

    const request = this.currentSettingId
      ? this.layoutService.update(this.currentSettingId, payload)
      : this.layoutService.create(payload);

    request.subscribe({
      next: (res) => {
        if (!this.currentSettingId && res.id) {
          this.currentSettingId = res.id;
        }
        this.isSaving = false;
        this.toastr.success('Lưu cấu hình thành công!');
      },
      error: (err) => {
        console.error('Lỗi lưu cấu hình:', err);
        this.isSaving = false;
        this.toastr.error('Có lỗi xảy ra khi lưu.');
      },
    });
  }

  private mergeWithDefaults(fetchedItems: HeaderNavItem[]): HeaderNavItem[] {
    return this.defaultItems.map((defaultItem) => {
      const found = fetchedItems.find((item) => item.id === defaultItem.id);
      if (found) {
        return {
          ...defaultItem,
          ...found,
          title: defaultItem.title, // Giữ title mặc định để hiển thị cho đẹp
          enable: found.enable !== undefined ? found.enable : defaultItem.enable,
        };
      }
      return defaultItem;
    });
  }
}
