import { useEffect } from 'react';
import { initErrorTracker } from '@mini-sentry/browser';
import type { ErrorTrackerConfig } from '@mini-sentry/browser';

export interface ErrorTrackerProviderProps {
  config: ErrorTrackerConfig;
  children: React.ReactNode;
}

export function ErrorTrackerProvider({ config, children }: ErrorTrackerProviderProps) {
  useEffect(() => {
    initErrorTracker(config);
    // intentionally runs once — config identity changes are ignored
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
