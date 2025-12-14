import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { Condition, Field, Operator, PaginatedResponse } from '../../../models/conditions.model';
import { InputFieldComponent } from '../input/input-field.component';
import { SelectComponent } from '../select/select.component';

@Component({
  selector: 'app-condition-row',
  templateUrl: './condition-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, InputFieldComponent, SelectComponent],
})
export class ConditionRowComponent implements OnInit {
  // Inputs / Outputs
  condition = model.required<Condition>();
  fields = input.required<Field[]>();
  remove = output<void>();

  // Signals
  loading = signal(false);
  options = signal<any[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  searchText = signal('');

  // Computed
  selectedField = computed<Field | undefined>(() => {
    const fieldId = this.condition().fieldId;
    return this.fields().find((f) => f.id === fieldId);
  });

  operatorOptions = computed(() => {
    const ops = this.selectedField()?.operators || [];
    return ops.map((op) => ({
      label: this.operatorNameMapping[op],
      value: op,
    }));
  });

  constructor(private cdr: ChangeDetectorRef) {}

  // [3] Thêm logic OnInit để load options khi vào chế độ Edit
  ngOnInit(): void {
    const field = this.selectedField();
    // Nếu field đã có sẵn (từ dữ liệu cũ) và là loại cần load options
    if (field && ['select', 'multi-select'].includes(field.type)) {
      this.initializeSelectOptions();
    }
  }

  // ===== Select options handling =====

  initializeSelectOptions(): void {
    this.options.set([]);
    this.currentPage.set(1);
    this.totalPages.set(1);
    this.searchText.set('');
    this.loadOptions('');
  }

  onTypeahead(search: string): void {
    this.searchText.set(search);
    this.currentPage.set(1);
    this.loadOptions(search);
  }

  onScrollToEnd(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadOptions(this.searchText());
    }
  }

  private loadOptions(search: string): void {
    const field = this.selectedField();
    const loader = field?.source?.optionsLoader;

    if (!field || !['select', 'multi-select'].includes(field.type) || !loader) return;

    this.loading.set(true);

    loader({ search, page: this.currentPage(), limit: 10 }).subscribe({
      next: (res: PaginatedResponse<any>) => {
        this.totalPages.set(res.totalPages);

        // Gộp hoặc reset tùy trang
        if (this.currentPage() === 1) {
          this.options.set(res.results);
        } else {
          this.options.update((prev) => [...prev, ...res.results]);
        }

        this.loading.set(false);
        this.cdr.markForCheck(); // ⚡ Đảm bảo UI update
      },
      error: () => this.loading.set(false),
    });
  }

  // ===== Condition actions =====

  onFieldChange(fieldId: string): void {
    const newField = this.fields().find((f) => f.id === fieldId);
    this.condition.update((c) => ({
      ...c,
      fieldId,
      operator: newField?.operators[0] || Operator.EQUALS,
      value: null,
    }));

    if (newField?.type === 'select' || newField?.type === 'multi-select') {
      this.initializeSelectOptions();
    }
  }

  onOperatorChange(operator: Operator): void {
    const isUnary = operator === Operator.IS_EMPTY || operator === Operator.IS_NOT_EMPTY;
    this.condition.update((c) => ({ ...c, operator, value: isUnary ? null : c.value }));
  }

  onValueChange(value: any): void {
    this.condition.update((c) => ({ ...c, value }));
  }

  getOperatorLabel(op: Operator): string {
    return this.operatorNameMapping[op];
  }

  get operatorNameMapping(): Record<Operator, string> {
    return {
      [Operator.EQUALS]: 'Bằng',
      [Operator.NOT_EQUALS]: 'Không bằng',
      [Operator.CONTAINS]: 'Chứa',
      [Operator.DOES_NOT_CONTAIN]: 'Không chứa',
      [Operator.GREATER_THAN]: 'Lớn hơn',
      [Operator.LESS_THAN]: 'Nhỏ hơn',
      [Operator.IS_EMPTY]: 'Rỗng',
      [Operator.IS_NOT_EMPTY]: 'Không rỗng',
      [Operator.IN]: 'Nằm trong',
      [Operator.NOT_IN]: 'Không nằm trong',
      [Operator.BETWEEN]: 'Trong khoảng',
      [Operator.NOT_BETWEEN]: 'Không trong khoảng',
      [Operator.BEFORE]: 'Trước',
      [Operator.AFTER]: 'Sau',
    };
  }
}
