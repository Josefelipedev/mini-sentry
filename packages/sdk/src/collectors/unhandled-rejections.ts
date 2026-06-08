import { getState } from '../core/state';
import { addBreadcrumb } from '../breadcrumbs';
import { generateFingerprint } from '../fingerprint';
import { sendEvent } from '../transport';

export function installUnhandledRejectionCollector(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const state = getState();
    const config = state.config;
    if (!config) return;

    const reason = event.reason as unknown;
    let message: string;
    let stack: string | undefined;

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else if (typeof reason === 'string') {
      message = reason;
    } else {
      message = `Unhandled Promise rejection: ${JSON.stringify(reason)}`;
    }

    addBreadcrumb({
      type: 'console',
      category: 'unhandledrejection',
      message,
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
      type: 'promise',
      message,
      stack,
      fingerprint,
    });
  });
}
