import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Cần cho *ngIf, *ngFor, async, date pipe
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogPostService } from '../../../../services/api/blog-post.service';
import { SafeHtmlPipe } from '../../../../pipe/safe-html.pipe';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-blog-post-detail',
  standalone: true, // Giống như component 'add' của bạn, đây là standalone
  imports: [
    CommonModule,
    RouterModule, // Cần cho routerLink (nếu bạn muốn thêm)
    SafeHtmlPipe, // Cần để render HTML
  ],
  templateUrl: './blog-post-detail.component.html',
})
export class BlogPostDetailComponent implements OnInit {
  post: any; // Sử dụng 'any' để khớp với component 'add' của bạn
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogPostService: BlogPostService,
    private toastr: ToastrService,
  ) {}

  ngOnInit() {
    // Lấy ID từ URL
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.toastr.error('No post ID provided', 'Error');
      this.router.navigateByUrl('/blog-post'); // Quay về trang danh sách
      return;
    }

    this.loadPost(id);
  }

  loadPost(id: string) {
    this.isLoading = true;
    this.blogPostService
      .getById(id, {
        populate: 'categories;tags',
      })
      .subscribe({
        next: (data) => {
          this.post = data;
          this.isLoading = false;
          console.log('Post data loaded:', this.post);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.toastr.error('Failed to load post', 'Error');
          this.router.navigateByUrl('/blog-post'); // Quay về trang danh sách
        },
      });
  }
}
