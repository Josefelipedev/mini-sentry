import { getState, setState } from './state';
import { resolveConfig } from './config';
import type { ErrorTrackerConfig } from './config';
import { Throttle } from '../utils/throttle';
import { installGlobalErrorCollector } from '../collectors/global-errors';
import { installUnhandledRejectionCollector } from '../collectors/unhandled-rejections';
import { installHttpCollector } from '../collectors/http';
import { installConsoleCollector } from '../collectors/console';
import { installNavigationBreadcrumbs } from '../breadcrumbs';
import { installWebVitalsCollector } from '../collectors/web-vitals';
import { initSession } from '../session';
import { generateFingerprint } from '../fingerprint';
import { sendEvent } from '../transport';

export function initErrorTracker(config: ErrorTrackerConfig): void {
  if (typeof window === 'undefined') return;

  const state = getState();
  if (state.initialized) return;

  const resolved = resolveConfig(config);

  setState({
    config: resolved,
    initialized: true,
    breadcrumbs: [],
    throttle: new Throttle(),
  });

  initSession();
  installGlobalErrorCollector();
  installUnhandledRejectionCollector();
  installNavigationBreadcrumbs();

  if (resolved.enableHttpTracking) installHttpCollector();
  if (resolved.enableConsoleCapture) installConsoleCollector();
  if (resolved.enablePerformance) installWebVitalsCollector();
}

export function captureException(
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const state = getState();
  const config = state.config;
  if (!config) return;

  const err = error instanceof Error ? error : new Error(String(error));
  const fingerprint = generateFingerprint({
    message: err.message,
    stack: err.stack,
    appName: config.appName,
    environment: config.environment,
  });

  if (!state.throttle.shouldAllow(fingerprint)) return;

  sendEvent({
    type: 'error',
    message: err.message,
    stack: err.stack,
    fingerprint,
    metadata,
  });
}

export function captureMessage(
  message: string,
  metadata?: Record<string, unknown>
): void {
  const state = getState();
  const config = state.config;
  if (!config) return;

  const fingerprint = generateFingerprint({
    message,
    appName: config.appName,
    environment: config.environment,
  });

  if (!state.throttle.shouldAllow(fingerprint)) return;

  sendEvent({ type: 'message', message, fingerprint, metadata });
}
