import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../../../form/label/label.component';
import { InputFieldComponent } from '../../../form/input/input-field.component';
import { SelectComponent } from '../../../form/select/select.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { BlogPostService } from '../../../../services/api/blog-post.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { createFormData, deepSanitize } from '../../../../utils/form-data.utils';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { FileService } from '../../../../services/api/file.service';
import { CustomUploadAdapter } from '../../../../utils/ckeditor-upload-adapter';
import { BlogTagService } from '../../../../services/api/blog-tag.service';
import { BlogCategoryService } from '../../../../services/api/blog-category.service';
import { BlogCategory } from '../../../../models/blog-category.model';
import { BlogTag } from '../../../../models/blog-tag.model';
import { NgSelectModule } from '@ng-select/ng-select';
import { ImageUploadComponent } from '../../../_core/image-upload/image-upload.component';
import { SafeHtmlPipe } from '../../../../pipe/safe-html.pipe';

interface BlogPostFormData {
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  coverImageAlt: string;
  categories?: string[];
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt?: any;
  isFeatured: boolean;
  isPinned: boolean;
  seoTitle: string;
  seoDescription: string;
}

const DEFAULT_FORM: BlogPostFormData = {
  title: '',
  summary: '',
  content: '',
  coverImage: '',
  coverImageAlt: '',
  categories: [],
  tags: [],
  status: 'draft',
  publishedAt: '',
  isFeatured: false,
  isPinned: false,
  seoTitle: '',
  seoDescription: '',
};

@Component({
  selector: 'app-blog-post-add',
  imports: [
    CommonModule,
    FormsModule,
    CKEditorModule,
    NgSelectModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    ButtonComponent,
    ImageUploadComponent,
    SafeHtmlPipe,
  ],
  templateUrl: './blog-post-add.component.html',
  styles: ``,
})
export class BlogPostAddComponent implements OnInit {
  postId: string | null = null;
  isEditMode: boolean = false;

  imagePreview: string | null = null;
  selectedFile: File | null = null;

  // Thêm thuộc tính này để quản lý chế độ xem
  public viewMode: 'write' | 'preview' = 'write';

  // Form data
  postData = createFormData(DEFAULT_FORM);

  statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'archived', label: 'Archived' },
  ];

  // UI state - Expandable sections
  expandedSections: Set<string> = new Set(['basic']); // Basic info expanded by default

  // Tag input
  tagInput: string = '';
  categoryInput: string = '';

  // --- THAY ĐỔI ---
  // Dữ liệu cho dropdowns
  allCategories: BlogCategory[] = [];
  allTags: BlogTag[] = [];
  // --- KẾT THÚC THAY ĐỔI ---

  public Editor: any = ClassicEditor;
  public editorData: string = '<p>Bắt đầu soạn thảo...</p>';
  public editorConfig = {};

  constructor(
    private blogPostService: BlogPostService,
    private toastr: ToastrService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private fileService: FileService,
    private blogTagService: BlogTagService,
    private blogCategoryService: BlogCategoryService,
  ) {}

  ngOnInit() {
    this.activatedRoute.paramMap.subscribe((params: any) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.postId = id;
        this.loadBlogPost(id);
      }
      this.loadTaxonomies();
    });

    this.editorConfig = {
      placeholder: 'Nhập nội dung...',
    };
  }

  onReady(editor: any) {
    // ✅ Thiết lập upload adapter trực tiếp ở đây
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new CustomUploadAdapter(loader, this.fileService);
    };
  }

  // --- HÀM MỚI ---
  loadTaxonomies() {
    // Load tất cả categories đang active
    this.blogCategoryService.getAll({ limit: 1000, isActive: true }).subscribe((data) => {
      this.allCategories = data.results;
    });
    // Load tất cả tags
    this.blogTagService.getAll({ limit: 1000 }).subscribe((data) => {
      this.allTags = data.results;
    });
  }
  // --- KẾT THÚC HÀM MỚI --

  loadBlogPost(id: string) {
    this.blogPostService.getById(id).subscribe({
      next: (data: any) => {
        this.postData = {
          ...data,
          publishedAt: data.publishedAt
            ? new Date(data.publishedAt).toISOString().split('T')[0]
            : '',
          categories: data.categories || [],
          tags: data.tags || [],
        };

        console.log('data', data);
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Cannot load blog post data', 'Error');
      },
    });
  }

  // Section toggle
  toggleSection(section: string) {
    if (this.expandedSections.has(section)) {
      this.expandedSections.delete(section);
    } else {
      this.expandedSections.add(section);
    }
  }

  isSectionExpanded(section: string): boolean {
    return this.expandedSections.has(section);
  }

  handleSelectChange(field: keyof BlogPostFormData, value: string) {
    (this.postData as any)[field] = value;
  }

  handleCheckboxChange(field: keyof BlogPostFormData, checked: boolean) {
    (this.postData as any)[field] = checked;
  }

  onFileSelected(file: File) {
    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = (e) => (this.imagePreview = e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload lên server
    this.fileService.uploadFile(file).subscribe({
      next: (res) => (this.postData.coverImage = res.url),
      error: (err) => {
        console.error(err);
        this.toastr.error('Upload failed!', 'Image');
      },
    });
  }

  // Validate form
  validateForm(): boolean {
    if (!this.postData.title.trim()) {
      this.toastr.error('Title is required', 'Validation');
      return false;
    }

    if (!this.postData.content.trim()) {
      this.toastr.error('Content is required', 'Validation');
      return false;
    }

    if (this.postData.status === 'published' && !this.postData.publishedAt) {
      this.toastr.error('Published date is required for published posts', 'Validation');
      return false;
    }

    return true;
  }

  // Submit handlers
  onSave() {
    if (!this.validateForm()) return;

    console.log('this.form', this.postData);

    const sanitized = deepSanitize(this.postData, DEFAULT_FORM);

    console.log('sanitized', sanitized);

    const obs =
      this.isEditMode && this.postId
        ? this.blogPostService.update(this.postId, sanitized)
        : this.blogPostService.create(sanitized);

    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.isEditMode ? 'Blog post updated successfully!' : 'Blog post created successfully!',
          'Success',
        );
        this.router.navigateByUrl('/blog-post');
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
    this.router.navigateByUrl('/blog-post');
  }
}
