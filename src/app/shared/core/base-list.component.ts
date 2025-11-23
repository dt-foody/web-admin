import { Directive, OnInit } from '@angular/core';
import { ListQueryState, SortState } from '../utils/types';

@Directive()
export abstract class BaseListComponent<T extends { id: string }> implements OnInit {
  dataSources: T[] = [];
  totalResults = 0;
  totalPages = 0;

  iconDelete = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>`;
  iconAdd = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 10.0002H15.0006M10.0002 5V15.0006" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>`;
  iconEdit = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
      <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>`;
  classOutlineDanger =
    'border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20';

  selected: string[] = [];

  query: ListQueryState | any = {
    search: '',
    page: 1,
    pageSize: 10,
    sort: { key: 'createdAt', asc: false },
  };

  abstract fetchData(): void;

  ngOnInit(): void {
    this.fetchData();
  }

  onSearchChange(keyword: string) {
    this.query.search = keyword;
    this.query.page = 1;
    this.fetchData();
  }

  onPageChange(page: number) {
    this.query.page = page;
    this.fetchData();
  }

  onSortChange(key: string) {
    if (this.query.sort?.key === key) {
      this.query.sort.asc = !this.query.sort.asc;
    } else {
      this.query.sort = { key, asc: true };
    }
    this.fetchData();
  }

  toggleSelect(id: string, checked: boolean) {
    if (checked) {
      // Thêm id nếu chưa có
      if (!this.selected.includes(id)) {
        this.selected.push(id);
      }
    } else {
      // Loại bỏ id nếu unchecked
      this.selected = this.selected.filter((item) => item !== id);
    }
  }

  toggleAll(): void {
    console.log('toggleAll');
    const ids = this.dataSources.map((p) => p.id);
    this.selected = this.isAllSelected()
      ? this.selected.filter((id) => !ids.includes(id))
      : [...new Set([...this.selected, ...ids])];
  }

  isAllSelected(): boolean {
    const ids = this.dataSources.map((p) => p.id);
    return ids.length > 0 && ids.every((id) => this.selected.includes(id));
  }

  formatDate(dateString?: string | Date): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  formatDateTime(date?: string | Date): string {
    if (!date) return '-';
    const d = new Date(date);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  getInitials(name: string): string {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .substring(0, 2)
      : 'A';
  }

  getFormattedPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(numPrice);
  }
}
