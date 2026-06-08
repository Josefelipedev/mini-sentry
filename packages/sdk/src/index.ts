export { initErrorTracker, captureException, captureMessage } from './core/init';
export { setUser, clearUser } from './session';
export { addBreadcrumb } from './breadcrumbs';
export type { ErrorTrackerConfig } from './core/config';
export type { BreadcrumbEntry, ErrorPayload, BrowserInfo } from './types';
