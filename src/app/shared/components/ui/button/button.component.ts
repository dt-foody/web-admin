import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SafeHtmlPipe } from '../../../pipe/safe-html.pipe';

type BtnSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg';
type BtnVariant = 'primary' | 'outline';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './button.component.html',
  styles: ``,
})
export class ButtonComponent {
  /** Kích thước: thêm 2 mức nhỏ hơn sm */
  @Input() size: BtnSize = 'sm';
  /** Biến thể giao diện */
  @Input() variant: BtnVariant = 'primary';
  /** Trạng thái vô hiệu */
  @Input() disabled = false;
  /** Trạng thái loading */
  @Input() loading = false;
  /** Type của nút */
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  /** Thêm class ngoài */
  @Input() className = '';
  /** Chế độ chỉ hiển thị icon (không label) */
  @Input() iconOnly = false;
  /** Icon đầu/cuối dạng SVG string (đã được sanitize qua SafeHtmlPipe) */
  @Input() startIcon?: string;
  @Input() endIcon?: string;
  /** A11y: bắt buộc có khi iconOnly=true */
  @Input() ariaLabel?: string;

  @Output() btnClick = new EventEmitter<Event>();

  /** Tailwind sizing map */
  private sizeMap: Record<
    BtnSize,
    { pad: string; text: string; gap: string; square: string; spinner: string }
  > = {
    '2xs': {
      pad: 'px-2.5 py-1',
      text: 'text-[11px]',
      gap: 'gap-1.5',
      square: 'size-7',
      spinner: 'w-3 h-3',
    },
    xs: {
      pad: 'px-3 py-1.5',
      text: 'text-xs',
      gap: 'gap-1.5',
      square: 'size-8',
      spinner: 'w-3 h-3',
    },
    sm: {
      pad: 'px-4 py-2',
      text: 'text-sm',
      gap: 'gap-2',
      square: 'size-9',
      spinner: 'w-3.5 h-3.5',
    },
    md: {
      pad: 'px-5 py-2.5',
      text: 'text-sm',
      gap: 'gap-2',
      square: 'size-10',
      spinner: 'w-4 h-4',
    },
    lg: {
      pad: 'px-6 py-3',
      text: 'text-base',
      gap: 'gap-2.5',
      square: 'size-11',
      spinner: 'w-4 h-4',
    },
  };

  get sizeClasses(): string {
    const s = this.sizeMap[this.size];
    return this.iconOnly ? `${s.square} ${s.text}` : `${s.pad} ${s.text} ${s.gap}`;
  }

  get spinnerSize(): string {
    return this.sizeMap[this.size].spinner;
  }

  get variantClasses(): string {
    return this.variant === 'primary'
      ? 'bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300'
      : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300';
  }

  get disabledClasses(): string {
    return this.disabled || this.loading ? 'cursor-not-allowed opacity-60' : '';
  }

  onClick(event: Event) {
    if (!this.disabled && !this.loading) {
      this.btnClick.emit(event);
    }
  }
}
