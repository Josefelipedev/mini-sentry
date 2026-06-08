import { getState } from '../core/state';
import { getBrowserInfo } from '../utils/browser';
import { getSessionId } from '../session';
import { filterSensitiveFields } from '../utils/filter';
import type { ErrorPayload } from '../types';

interface SendOptions {
  type: ErrorPayload['type'];
  message: string;
  stack?: string;
  filename?: string;
  line?: number;
  column?: number;
  fingerprint: string;
  metadata?: Record<string, unknown>;
}

export function sendEvent(options: SendOptions): void {
  const state = getState();
  const config = state.config;
  if (!config || !state.initialized) return;

  if (config.sampleRate < 1 && Math.random() > config.sampleRate) return;

  let payload: ErrorPayload = {
    apiKey: config.apiKey,
    appName: config.appName,
    environment: config.environment,
    version: config.version,
    release: config.release,
    sessionId: getSessionId(),
    userId: state.userId || config.userId || undefined,
    fingerprint: options.fingerprint,
    type: options.type,
    message: options.message,
    stack: options.stack,
    filename: options.filename,
    line: options.line,
    column: options.column,
    url: typeof window !== 'undefined' ? window.location.href : '',
    browser: getBrowserInfo(),
    breadcrumbs: [...state.breadcrumbs],
    metadata: options.metadata,
    timestamp: Date.now(),
  };

  // Strip sensitive fields before beforeSend so the hook receives clean data
  payload.metadata = filterSensitiveFields(payload.metadata, config.denyList);

  if (config.beforeSend) {
    const result = config.beforeSend(payload);
    if (!result) return;
    payload = result;
  }

  dispatch(config.endpoint, payload);
}

function dispatch(endpoint: string, payload: ErrorPayload): void {
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(
        endpoint,
        new Blob([body], { type: 'application/json' })
      );
      if (sent) return;
    }
  } catch {
    // fall through to fetch
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // never throw from the error tracker
  });
}
