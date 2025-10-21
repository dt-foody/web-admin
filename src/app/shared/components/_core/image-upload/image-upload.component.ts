// image-upload.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  imports: [CommonModule],
})
export class ImageUploadComponent {
  @Input() imagePreview: string | ArrayBuffer | null = null;
  @Output() fileSelected = new EventEmitter<File>();

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fileSelected.emit(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
