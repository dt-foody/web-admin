import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ColorSketchModule } from 'ngx-color/sketch';

// Giả lập Service và Model
import { BlogTag } from '../../../../models/blog-tag.model'; // Import model BlogTag
import { BlogTagService } from '../../../../services/api/blog-tag.service'; // Service cho BlogTag

// Components dùng chung
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';

// Utilities
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';
import { generateSlug } from '../../../../utils/slugify.util'; // Giả sử bạn có một hàm slugify
import { ColorEvent } from 'ngx-color';

interface BlogTagFormData {
  name: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

const DEFAULT_FORM: BlogTagFormData = {
  name: '',
  description: '',
  backgroundColor: '#E0E0E0', // Màu mặc định đã thảo luận
  textColor: '#212121',
  isActive: true,
};

@Component({
  selector: 'app-blog-tag-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ColorSketchModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
  ],
  templateUrl: './blog-tag-add.component.html',
})
export class BlogTagAddComponent implements OnInit {
  tagId: string | null = null;
  isEditMode: boolean = false;

  // Form data
  formData = createFormData(DEFAULT_FORM);

  statusOptions = [
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  activePicker: 'bg' | 'text' | null = null;

  constructor(
    private blogTagService: BlogTagService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.tagId = id;
        this.loadTag(id);
      }
    });
  }

  loadTag(id: string) {
    this.blogTagService.getById(id).subscribe({
      next: (data: BlogTag) => {
        // Gán giá trị vào form, sử dụng giá trị mặc định nếu thiếu
        this.formData = {
          name: data.name || '',
          description: data.description || '',
          backgroundColor: data.backgroundColor || DEFAULT_FORM.backgroundColor,
          textColor: data.textColor || DEFAULT_FORM.textColor,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load tag data', 'Error');
        this.router.navigateByUrl('/blog/tags');
      },
    });
  }

  handleSelectChange(field: keyof BlogTagFormData, value: string) {
    if (field === 'isActive') {
      this.formData.isActive = value === 'true';
    }
  }

  onNameChange(newName: any) {
    this.formData.name = newName;
  }

  /**
   * Mở/đóng color picker tương ứng
   * @param picker 'bg' hoặc 'text'
   */
  togglePicker(picker: 'bg' | 'text') {
    if (this.activePicker === picker) {
      this.activePicker = null; // Đóng nếu đang mở
    } else {
      this.activePicker = picker; // Mở picker được chọn
    }
  }

  /**
   * Cập nhật màu từ color picker
   * @param field 'backgroundColor' hoặc 'textColor'
   * @param event Dữ liệu màu từ ngx-color (kiểu ColorEvent)
   */
  // SỬA LẠI HÀM NÀY
  onColorChange(field: 'backgroundColor' | 'textColor', event: ColorEvent) {
    if (event && event.color && event.color.hex) {
      this.formData[field] = event.color.hex;
    }
  }

  // Validate form
  validateForm(): boolean {
    if (!this.formData.name.trim()) {
      this.toastr.error('Tag name is required', 'Validation');
      return false;
    }
    return true;
  }

  // Submit handlers
  onSave() {
    if (!this.validateForm()) return;

    // Backend sẽ tự tạo slug nếu rỗng, nhưng ta gửi slug đã tạo sẵn
    const sanitized = deepSanitize(this.formData, DEFAULT_FORM);

    const obs =
      this.isEditMode && this.tagId
        ? this.blogTagService.update(this.tagId, sanitized)
        : this.blogTagService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Tag updated successfully!' : 'Tag created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/blog-tag');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err?.error?.message || (this.isEditMode ? 'Update failed!' : 'Create failed!'),
          'Error',
        );
      },
    });
  }

  onCancel() {
    this.router.navigateByUrl('/blog-tag');
  }
}
