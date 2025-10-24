import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-switch',
  standalone: true,
  imports: [CommonModule],
  template: `
    <label
      class="flex cursor-pointer select-none items-center gap-3 text-sm font-medium"
      [ngClass]="disabled ? 'text-gray-400' : 'text-gray-700 dark:text-gray-400'"
      (click)="handleToggle()"
    >
      <div class="relative">
        <div
          class="block transition duration-150 ease-linear h-6 w-11 rounded-full"
          [ngClass]="
            disabled ? 'bg-gray-100 pointer-events-none dark:bg-gray-800' : switchColors.background
          "
        ></div>
        <div
          class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow-theme-sm duration-150 ease-linear transform"
          [ngClass]="switchColors.knob"
        ></div>
      </div>
      {{ label }}
    </label>
  `,
})
export class SwitchComponent {
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() color: 'blue' | 'gray' = 'blue';

  // Thay đổi 1: Dùng @Input() value thay vì defaultChecked.
  @Input() value: boolean = false;

  @Output() valueChange = new EventEmitter<boolean>();

  // Thay đổi 2: Loại bỏ isChecked và ngOnChanges.

  handleToggle() {
    if (this.disabled) return;
    // Thay đổi 3: Emit giá trị mới, ngược với giá trị hiện tại.
    this.valueChange.emit(!this.value);
  }

  get switchColors() {
    const onBg = this.color === 'blue' ? 'bg-brand-500' : 'bg-gray-800';
    const offBg = 'bg-gray-200 dark:bg-white/10';
    return {
      // Thay đổi 4: Dùng this.value thay vì this.isChecked
      background: this.value ? onBg : offBg,
      knob: this.value ? 'translate-x-full bg-white' : 'translate-x-0 bg-white',
    };
  }
}
