import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef } from '@ngneat/dialog';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { ProductService } from '../../../../services/api/product.service';
import { Product } from '../../../../models/product.model';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../../../environments/environment';

interface ModalData {
  categoryId: string;
  categoryName: string;
}

@Component({
  selector: 'app-product-sort-modal',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col w-full h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
      
      <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
            Sắp xếp thứ tự hiển thị
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Danh mục: <span class="font-medium text-brand-600 dark:text-brand-400">{{ ref.data.categoryName }}</span>
            <span class="mx-2 text-gray-300">|</span>
            Tổng số: <span class="font-medium text-gray-900 dark:text-white">{{ products.length }} sản phẩm</span>
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <button (click)="ref.close()" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900/50 p-5 custom-scrollbar">
        
        @if (isLoading) {
          <div class="flex flex-col items-center justify-center h-full">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500 mb-4"></div>
            <p class="text-gray-500 font-medium">Đang tải dữ liệu...</p>
          </div>
        } @else if (products.length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p class="text-lg">Danh mục này chưa có sản phẩm nào.</p>
          </div>
        } @else {
          <div 
            cdkDropList 
            cdkDropListOrientation="mixed" 
            class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 pb-20" 
            (cdkDropListDropped)="drop($event)">
            
            @for (product of products; track product.id) {
              <div 
                cdkDrag 
                [cdkDragData]="product"
                class="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-500 cursor-grab active:cursor-grabbing overflow-hidden flex flex-col h-full select-none hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                
                <div *cdkDragPlaceholder class="bg-gray-200 dark:bg-gray-700 border-2 border-dashed border-gray-400 rounded-lg opacity-40"></div>

                <div class="aspect-square w-full relative bg-gray-100 dark:bg-gray-900/50 overflow-hidden">
                  <img [src]="product.image || 'assets/images/placeholder.png'" 
                       class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                       alt="">
                  
                  <div class="absolute top-1.5 left-1.5 bg-gray-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm z-10 shadow-sm">
                    # {{ product.priority + 1 }}
                  </div>

                  <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <span class="bg-white/90 text-gray-800 p-1.5 rounded-full shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
                        </svg>
                     </span>
                  </div>
                </div>

                <div class="p-2 flex flex-col flex-1 gap-1">
                  <h4 class="text-[11px] leading-snug font-medium text-gray-700 dark:text-gray-200 line-clamp-2 min-h-[2.2em]" [title]="product.name">
                    {{ product.name }}
                  </h4>
                  
                  <div class="mt-auto flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-gray-700/50">
                    <span class="text-brand-600 dark:text-brand-400 font-bold text-[11px]">
                      {{ product.basePrice | number }}đ
                    </span>
                    
                    <div [class]="product.isActive ? 'bg-green-500' : 'bg-gray-300'" 
                         class="h-2 w-2 rounded-full ring-2 ring-white dark:ring-gray-700 shadow-sm"
                         [title]="product.isActive ? 'Đang hiển thị' : 'Đang ẩn'">
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center shrink-0">
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Kéo thả để thay đổi vị trí. Hệ thống tự động lưu.</span>
        </div>
        <button (click)="ref.close()" class="px-6 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 active:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500">
          Hoàn tất
        </button>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.4); border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.6); }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      background-color: white; 
      opacity: 0.95;
      transform: scale(1.05);
      z-index: 9999 !important;
      cursor: grabbing;
    }
    
    .cdk-drag-placeholder { opacity: 0.3; }
    
    .cdk-drag-animating {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class ProductSortModalComponent implements OnInit {
  products: Product[] = [];
  isLoading = false;

  constructor(
    public ref: DialogRef<ModalData>,
    private productService: ProductService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.isLoading = true;
    this.cdr.markForCheck(); 

    const categoryId = this.ref.data.categoryId;

    this.productService.getAll({ 
      category: categoryId, 
      limit: 1000,
      sortBy: 'priority:asc' 
    } as any).subscribe({
      next: (res: any) => {
        let items = res.results || res || [];
        
        items = items.map((p: Product) => ({
          ...p,
          image: p.image ? `${environment.urlBaseImage}${p.image}` : ''
        }));

        this.products = items.sort((a: Product, b: Product) => (a.priority || 0) - (b.priority || 0));
        this.isLoading = false;
        this.cdr.markForCheck(); 
      },
      error: () => {
        this.toastr.error('Không thể tải danh sách sản phẩm');
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  drop(event: CdkDragDrop<Product[]>) {
    if (event.previousIndex === event.currentIndex) return;

    moveItemInArray(this.products, event.previousIndex, event.currentIndex);
    
    // Cập nhật lại số thứ tự trên UI ngay lập tức
    this.products.forEach((p, index) => p.priority = index);
    
    this.cdr.markForCheck(); 

    const updateObservables = this.products.map((item, index) => {
      return this.productService.update(item.id, { priority: index });
    });

    if (updateObservables.length > 0) {
      forkJoin(updateObservables).subscribe({
        next: () => { },
        error: () => {
          this.toastr.error('Lỗi khi lưu thứ tự, đang tải lại...');
          this.loadProducts();
        }
      });
    }
  }
}