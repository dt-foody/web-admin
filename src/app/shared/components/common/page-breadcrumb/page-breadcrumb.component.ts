import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  url?: string;
}

@Component({
  selector: 'app-page-breadcrumb',
  imports: [CommonModule, RouterModule],
  templateUrl: './page-breadcrumb.component.html',
  styles: ``,
})
export class PageBreadcrumbComponent {
  @Input() pageTitle = '';
  @Input() breadcrumbItems: BreadcrumbItem[] = [];
}
