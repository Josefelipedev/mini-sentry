import { getState } from '../core/state';
import { addBreadcrumb } from '../breadcrumbs';
import { generateFingerprint } from '../fingerprint';
import { sendEvent } from '../transport';

export function installGlobalErrorCollector(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event: ErrorEvent) => {
    const state = getState();
    const config = state.config;
    if (!config) return;

    const error = event.error as Error | null;
    const message = error?.message ?? event.message ?? 'Unknown error';
    const stack = error?.stack;

    addBreadcrumb({
      type: 'console',
      category: 'error',
      message,
      data: { filename: event.filename, line: event.lineno, col: event.colno },
      timestamp: Date.now(),
    });

    const fingerprint = generateFingerprint({
      message,
      stack,
      appName: config.appName,
      environment: config.environment,
    });

    if (!state.throttle.shouldAllow(fingerprint)) return;

    sendEvent({
      type: 'error',
      message,
      stack,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      fingerprint,
    });
  });
}
