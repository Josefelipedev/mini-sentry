import type { App } from 'vue';
import { initErrorTracker, captureException } from '@mini-sentry/browser';
import type { ErrorTrackerConfig } from '@mini-sentry/browser';

export type MiniSentryPluginOptions = ErrorTrackerConfig;

export const MiniSentryPlugin = {
  install(app: App, options: MiniSentryPluginOptions): void {
    initErrorTracker(options);

    app.config.errorHandler = (err: unknown, _instance, info: string) => {
      captureException(
        err instanceof Error ? err : new Error(String(err)),
        { vueInfo: info }
      );
    };
  },
};
