import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr'; // Import provideToastr

import { routes } from './app.routes';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi(), withInterceptors([AuthInterceptor])),
    provideAnimations(), // Required for ngx-toastr animations
    provideToastr({
      // Configure global toastr options
      timeOut: 2000,
      progressBar: true,
      progressAnimation: 'decreasing',
      closeButton: true,
      positionClass: 'toast-top-right', // Có thể thêm vị trí
      preventDuplicates: true,
    }),
  ],
};
