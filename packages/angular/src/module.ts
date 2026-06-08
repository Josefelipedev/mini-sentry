import { ModuleWithProviders, NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { initErrorTracker } from '@mini-sentry/browser';
import type { ErrorTrackerConfig } from '@mini-sentry/browser';
import { MiniSentryErrorHandler } from './error-handler';
import { MiniSentryHttpInterceptor } from './http-interceptor';

@NgModule({
  imports: [HttpClientModule],
})
export class MiniSentryModule {
  static forRoot(config: ErrorTrackerConfig): ModuleWithProviders<MiniSentryModule> {
    initErrorTracker(config);

    return {
      ngModule: MiniSentryModule,
      providers: [
        { provide: ErrorHandler, useClass: MiniSentryErrorHandler },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MiniSentryHttpInterceptor,
          multi: true,
        },
      ],
    };
  }
}
