import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Product } from '../../../../models/product.model';
import { ProductService } from '../../../../services/api/product.service';
import { environment } from '../../../../../../environments/environment';
import { DialogService } from '@ngneat/dialog';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '../../../_core/pagination/pagination.component';
import { SearchInputComponent } from '../../../_core/search-input/search-input.component';
import { BaseListComponent } from '../../../../core/base-list.component';
import { SortHeaderComponent } from '../../../_core/sort-header/sort-header.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  selector: 'app-product-list',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    SearchInputComponent,
    SortHeaderComponent,
    HasPermissionDirective,
  ],
  templateUrl: './product-list.component.html',
  styles: ``,
})
export class ProductListComponent extends BaseListComponent<Product> implements OnInit {
  @ViewChild('confirmDelete') confirmDeleteTpl!: TemplateRef<any>;
  @ViewChild('filterRef') filterRef!: ElementRef;

  itemToDelete: Product | null = null;

  constructor(
    private productService: ProductService,
    private router: Router,
    private dialog: DialogService,
    private toastr: ToastrService,
  ) {
    super();
  }

  override ngOnInit(): void {
    console.log('ProductListComponent init logic');

    // ✅ Gọi lại base init
    super.ngOnInit();
  }

  fetchData() {
    const params: any = {
      page: this.query.page,
      limit: this.query.pageSize,
      populate: 'category',
      sortBy: this.query.sort?.key + ':' + (this.query.sort?.asc ? 'asc' : 'desc'),
    };

    // Add search query
    if (this.query && this.query.search && this.query.search.trim()) {
      params.search = this.query.search.trim();
    }

    this.productService.getAll(params).subscribe((data) => {
      this.dataSources = data.results;
      this.totalPages = data.totalPages;
      this.totalResults = data.totalResults;

      this.dataSources.forEach((el) => {
        el.thumbnailUrl = el.thumbnailUrl ? `${environment.urlBaseImage}${el.thumbnailUrl}` : '';
      });
    });
  }

  getOptionGroupsCount(product: Product): number {
    return product.optionGroups?.length || 0;
  }

  handleEdit(product: Product): void {
    this.router.navigate(['/product/edit', product.id]);
  }

  handleDelete(product: Product): void {
    this.itemToDelete = product;

    const dialogRef = this.dialog.open(this.confirmDeleteTpl, {
      data: {},
    });

    dialogRef.afterClosed$.subscribe((confirmed: boolean) => {
      if (confirmed && this.itemToDelete) {
        this.productService.delete(this.itemToDelete.id).subscribe(() => {
          this.toastr.success('Delete successfully!', 'Product');
          this.fetchData();
        });
      }
      this.itemToDelete = null;
    });
  }

  handleToggleActive(product: Product): void {
    this.productService.update(product.id, { isActive: !product.isActive }).subscribe({
      next: () => {
        product.isActive = !product.isActive;
        this.toastr.success('Update successfully!', 'Product');
      },
      error: () => {
        this.toastr.error('Update failed!', 'Product');
      },
    });
  }
}
