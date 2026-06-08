import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { captureException } from '@mini-sentry/browser';

@Injectable()
export class MiniSentryHttpInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          captureException(new Error(`HTTP ${err.status} ${req.method} ${req.url}`), {
            status: err.status,
            url: req.url,
            method: req.method,
          });
        }
        return throwError(() => err);
      }),
    );
  }
}
