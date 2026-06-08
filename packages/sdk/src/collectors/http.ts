import { getState } from '../core/state';
import { addBreadcrumb } from '../breadcrumbs';
import { generateFingerprint } from '../fingerprint';
import { sendEvent } from '../transport';
import { sendPerformanceEvent } from '../transport/performance';

export function installHttpCollector(): void {
  if (typeof window === 'undefined') return;
  patchFetch();
  patchXHR();
}

function patchFetch(): void {
  if (!window.fetch) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const state = getState();
    const config = state.config;

    const url = input instanceof Request ? input.url : String(input);
    const method = (
      init?.method ??
      (input instanceof Request ? input.method : 'GET')
    ).toUpperCase();

    if (!config || url === config.endpoint) {
      return originalFetch(input, init);
    }

    const startTime = Date.now();

    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - startTime;

      addBreadcrumb({
        type: 'http',
        category: 'fetch',
        message: `${method} ${url} ${response.status}`,
        data: { url, method, status: response.status, duration },
        timestamp: Date.now(),
      });

      if (!response.ok) {
        const fingerprint = generateFingerprint({
          message: `HTTP ${response.status} ${method} ${url}`,
          appName: config.appName,
          environment: config.environment,
        });

        if (state.throttle.shouldAllow(fingerprint)) {
          sendEvent({
            type: 'http',
            message: `HTTP ${response.status}: ${method} ${url}`,
            fingerprint,
            metadata: { url, method, status: response.status, duration },
          });
        }
      } else if (
        config.enablePerformance &&
        duration > config.slowRequestThreshold
      ) {
        addBreadcrumb({
          type: 'http',
          category: 'slow-request',
          message: `SLOW ${method} ${url} — ${duration}ms`,
          data: { url, method, duration },
          timestamp: Date.now(),
        });
        sendPerformanceEvent({
          type: 'http',
          name: `${method} ${url}`,
          value: duration,
          rating: duration > config.slowRequestThreshold * 2 ? 'poor' : 'needs-improvement',
        });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      addBreadcrumb({
        type: 'http',
        category: 'fetch',
        message: `${method} ${url} (network error)`,
        data: { url, method, error: String(error), duration },
        timestamp: Date.now(),
      });

      const fingerprint = generateFingerprint({
        message: `Network error: ${method} ${url}`,
        appName: config.appName,
        environment: config.environment,
      });

      if (state.throttle.shouldAllow(fingerprint)) {
        sendEvent({
          type: 'http',
          message: `Network error: ${method} ${url}`,
          fingerprint,
          metadata: { url, method, error: String(error), duration },
        });
      }

      throw error;
    }
  };
}

function patchXHR(): void {
  if (!window.XMLHttpRequest) return;

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    ...rest: unknown[]
  ) {
    (this as { _msUrl?: string; _msMethod?: string })._msUrl = String(url);
    (this as { _msUrl?: string; _msMethod?: string })._msMethod =
      method.toUpperCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (originalOpen as any).call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    const meta = this as { _msUrl?: string; _msMethod?: string };
    const url = meta._msUrl ?? '';
    const method = meta._msMethod ?? 'GET';
    const startTime = Date.now();

    this.addEventListener('loadend', () => {
      const state = getState();
      if (!state.config) return;

      addBreadcrumb({
        type: 'http',
        category: 'xhr',
        message: `${method} ${url} ${this.status}`,
        data: { url, method, status: this.status, duration: Date.now() - startTime },
        timestamp: Date.now(),
      });
    });

    return originalSend.call(this, body);
  };
}
