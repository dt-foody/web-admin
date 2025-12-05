import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({
  name: 'imageUrl',
  standalone: true // Nếu dùng Angular bản mới (14+), dùng standalone cho tiện
})
export class ImageUrlPipe implements PipeTransform {

  // Lấy URL gốc từ environment (VD: http://localhost:3000)
  private baseUrl = environment.urlBaseImage || 'http://localhost:3000'; 

  transform(imagePath?: string): string {
    // 1. Không có path -> Trả về ảnh mặc định
    if (!imagePath) {
      return 'https://placehold.co/200x200?text=No+Image';
    }

    // 2. Nếu đã là link online (http/https) -> Giữ nguyên
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // 3. Chuẩn hóa đường dẫn
    // Xóa dấu / ở cuối baseUrl (nếu có)
    const cleanBaseUrl = this.baseUrl.replace(/\/+$/, '');
    // Đảm bảo imagePath bắt đầu bằng /
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    const finalPath = `${cleanBaseUrl}${cleanPath}`;

    console.log("finalPath", finalPath);
    return finalPath;
  }
}