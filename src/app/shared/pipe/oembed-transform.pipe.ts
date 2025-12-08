import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'oembedTransform',
  standalone: true // Quan trọng: Để import trực tiếp vào component standalone
})
export class OembedTransformPipe implements PipeTransform {

  transform(content: string): string {
    if (!content) return '';

    // Regex tìm thẻ <oembed>
    const oembedRegex = /<oembed url="([^"]+)"><\/oembed>/g;

    return content.replace(oembedRegex, (match, url) => {
      // Xử lý link YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = this.getYoutubeId(url);
        if (videoId) {
          // Trả về iframe với class của Tailwind để responsive (aspect-video)
          return `
            <div class="w-full aspect-video my-4 rounded-lg overflow-hidden shadow-lg">
              <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                class="w-full h-full"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
              </iframe>
            </div>
          `;
        }
      }
      
      // Nếu là các loại link khác (SoundCloud, Vimeo...), bạn có thể thêm else if ở đây
      
      return match; // Trả về nguyên gốc nếu không xử lý được
    });
  }

  private getYoutubeId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
}