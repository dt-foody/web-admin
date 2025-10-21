import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() totalResults = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  get startItem() {
    return (this.page - 1) * this.pageSize + 1;
  }

  get endItem() {
    const end = this.page * this.pageSize;
    return end > this.totalResults ? this.totalResults : end;
  }

  prevPage() {
    if (this.page > 1) {
      this.pageChange.emit(this.page - 1);
    }
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.pageChange.emit(this.page + 1);
    }
  }

  goToPage(page: number) {
    if (page !== this.page) {
      this.pageChange.emit(page);
    }
  }
}
