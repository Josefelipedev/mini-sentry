import { captureException, captureMessage, setUser, clearUser } from '@mini-sentry/browser';

export function useErrorTracker() {
  return { captureException, captureMessage, setUser, clearUser } as const;
}
