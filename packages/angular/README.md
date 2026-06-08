# @mini-sentry/angular

Angular integration for [Mini Sentry](https://github.com/YOUR_ORG/mini-sentry).

Provides:
- `MiniSentryModule` — NgModule with `forRoot(config)` for initialization
- `MiniSentryErrorHandler` — global `ErrorHandler` for all uncaught errors
- `MiniSentryHttpInterceptor` — `HTTP_INTERCEPTORS` interceptor for HTTP error capture

## Install

```bash
npm install @mini-sentry/angular @mini-sentry/browser
```

## Usage

### app.module.ts

```ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MiniSentryModule } from '@mini-sentry/angular';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    MiniSentryModule.forRoot({
      endpoint: 'https://sentry.yourcompany.com/api/v1/ingest',
      apiKey: 'YOUR_API_KEY',
      appName: 'my-angular-app',
      environment: 'production',
      version: '1.0.0',
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

`forRoot()`:
- Calls `initErrorTracker` with your config
- Registers `MiniSentryErrorHandler` as the global `ErrorHandler`
- Registers `MiniSentryHttpInterceptor` for all `HttpClient` requests

### Manual capture

```ts
import { captureException, captureMessage, setUser } from '@mini-sentry/browser';

// In any service or component:
try {
  await this.paymentService.charge(amount);
} catch (err) {
  captureException(err, { orderId: '123' });
}
```

## Standalone / inject-based (Angular 17+)

If you're not using NgModule, register the providers manually:

```ts
import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MiniSentryErrorHandler, MiniSentryHttpInterceptor } from '@mini-sentry/angular';
import { initErrorTracker } from '@mini-sentry/browser';

initErrorTracker({ endpoint: '...', apiKey: '...', appName: 'my-app' });

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: ErrorHandler, useClass: MiniSentryErrorHandler },
    { provide: HTTP_INTERCEPTORS, useClass: MiniSentryHttpInterceptor, multi: true },
  ],
};
```

## Requirements

Angular 17, 18, or 19. RxJS 7+.
