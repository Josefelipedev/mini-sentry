import { ErrorHandler, Injectable } from '@angular/core';
import { captureException } from '@mini-sentry/browser';

@Injectable()
export class MiniSentryErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
    );
    console.error(error);
  }
}
