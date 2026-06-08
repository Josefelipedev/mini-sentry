import { addBreadcrumb } from '../breadcrumbs';

export function installConsoleCollector(): void {
  if (typeof console === 'undefined') return;

  const originalError = console.error.bind(console);

  console.error = function (...args: unknown[]) {
    originalError(...args);
    addBreadcrumb({
      type: 'console',
      category: 'console.error',
      message: args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ').slice(0, 300),
      timestamp: Date.now(),
    });
  };
}
