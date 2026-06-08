import { sendPerformanceEvent } from '../transport/performance';
import type { PerfRating } from '../types';

const reported = new Set<string>();

function rate(name: string, value: number): PerfRating {
  const thresholds: Record<string, [number, number]> = {
    LCP:  [2500, 4000],
    FID:  [100,  300],
    CLS:  [0.1,  0.25],
    INP:  [200,  500],
    TTFB: [800,  1800],
    FCP:  [1800, 3000],
  };
  const [good, poor] = thresholds[name] ?? [1000, 3000];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function report(name: string, value: number): void {
  if (reported.has(name)) return;
  reported.add(name);
  sendPerformanceEvent({ type: 'web-vital', name, value, rating: rate(name, value) });
}

function onHidden(cb: () => void): void {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') cb();
  }, { once: true });
  window.addEventListener('pagehide', cb, { once: true });
}

function observeLCP(): void {
  if (!('PerformanceObserver' in window)) return;
  let lastValue = 0;
  try {
    const po = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      lastValue = last.startTime;
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    onHidden(() => { if (lastValue > 0) report('LCP', lastValue); });
  } catch { /* unsupported */ }
}

function observeCLS(): void {
  if (!('PerformanceObserver' in window)) return;
  let clsValue = 0;
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const ls = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!ls.hadRecentInput) clsValue += ls.value;
      }
    });
    po.observe({ type: 'layout-shift', buffered: true });
    onHidden(() => report('CLS', clsValue));
  } catch { /* unsupported */ }
}

function observeINP(): void {
  if (!('PerformanceObserver' in window)) return;
  const durations: number[] = [];
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        durations.push(entry.duration);
      }
    });
    po.observe({ type: 'event', durationThreshold: 16, buffered: true });
    onHidden(() => {
      if (durations.length === 0) return;
      durations.sort((a, b) => a - b);
      const p98 = durations[Math.floor(durations.length * 0.98)] ?? durations[durations.length - 1];
      report('INP', p98);
    });
  } catch { /* unsupported */ }
}

function observeTTFB(): void {
  if (!('PerformanceObserver' in window)) return;
  try {
    const po = new PerformanceObserver((list) => {
      const entry = list.getEntries()[0] as PerformanceNavigationTiming | undefined;
      if (entry) report('TTFB', entry.responseStart - entry.requestStart);
    });
    po.observe({ type: 'navigation', buffered: true });
  } catch { /* unsupported */ }
}

export function installWebVitalsCollector(): void {
  if (typeof window === 'undefined') return;
  reported.clear();
  observeLCP();
  observeCLS();
  observeINP();
  observeTTFB();
}
