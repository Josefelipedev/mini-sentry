import { getState } from '../core/state';
import type { BreadcrumbEntry } from '../types';

export function addBreadcrumb(entry: BreadcrumbEntry): void {
  const state = getState();
  const max = state.config?.maxBreadcrumbs ?? 50;

  state.breadcrumbs.push(entry);

  if (state.breadcrumbs.length > max) {
    state.breadcrumbs.splice(0, state.breadcrumbs.length - max);
  }
}

export function installNavigationBreadcrumbs(): void {
  if (typeof window === 'undefined') return;

  const trackNavigation = (url: string) => {
    addBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      message: `Navigated to ${url}`,
      data: { url },
      timestamp: Date.now(),
    });
  };

  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    trackNavigation(String(args[2] ?? window.location.href));
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    trackNavigation(String(args[2] ?? window.location.href));
  };

  window.addEventListener('popstate', () => {
    trackNavigation(window.location.href);
  });

  window.addEventListener(
    'click',
    (event) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const tag = target.tagName.toLowerCase();
      if (tag !== 'button' && tag !== 'a' && !target.getAttribute('role')) return;

      const text = (target.textContent ?? '').trim().slice(0, 60);
      const id = target.id ? `#${target.id}` : '';
      const cls = target.className
        ? `.${String(target.className).split(' ')[0]}`
        : '';

      addBreadcrumb({
        type: 'click',
        category: 'ui.click',
        message: `Click on ${tag}${id}${cls}`,
        data: { tag, id, text },
        timestamp: Date.now(),
      });
    },
    { capture: true, passive: true }
  );
}
