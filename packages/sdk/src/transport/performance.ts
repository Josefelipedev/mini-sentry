import { getState } from '../core/state';
import { getSessionId } from '../session';
import type { PerfRating } from '../types';

interface PerfOptions {
  type: 'web-vital' | 'http' | 'navigation';
  name: string;
  value: number;
  rating: PerfRating;
}

export function sendPerformanceEvent(opts: PerfOptions): void {
  const state = getState();
  const config = state.config;
  if (!config || !state.initialized || !config.enablePerformance) return;

  const payload = {
    apiKey: config.apiKey,
    sessionId: getSessionId(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    type: opts.type,
    name: opts.name,
    value: opts.value,
    rating: opts.rating,
    version: config.version,
    environment: config.environment,
    timestamp: Date.now(),
  };

  const endpoint = config.performanceEndpoint;
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
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
  }).catch(() => {});
}
