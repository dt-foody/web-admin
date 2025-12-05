import { Directive, HostListener, Input } from '@angular/core';

@Directive({
  selector: 'img[appImageFallback]'
})
export class ImageFallbackDirective {
  @Input('appImageFallback') fallbackUrl: string = '/images/error/no-image.svg';

  @HostListener('error', ['$event'])
  onError(event: Event) {
    const element = event.target as HTMLImageElement;
    if (element.src !== this.fallbackUrl) {
      element.src = this.fallbackUrl;
    }
  }
}
