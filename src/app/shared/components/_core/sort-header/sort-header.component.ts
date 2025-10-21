import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sort-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sort-header.component.html',
})
export class SortHeaderComponent {
  @Input() label = '';
  @Input() key = '';
  @Input() activeKey = '';
  @Input() asc = true;
  @Input() className = ''; // 👈 Thêm dòng này

  @Output() sortChange = new EventEmitter<string>();

  get active() {
    return this.activeKey === this.key;
  }

  onSortClick() {
    this.sortChange.emit(this.key);
  }
}
