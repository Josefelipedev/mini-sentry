import type { ErrorPayload } from '../types';

export interface ErrorTrackerConfig {
  endpoint: string;
  apiKey: string;
  appName: string;
  environment?: string;
  version?: string;
  release?: string;
  userId?: string;
  sampleRate?: number;
  maxBreadcrumbs?: number;
  enablePerformance?: boolean;
  enableConsoleCapture?: boolean;
  enableHttpTracking?: boolean;
  slowRequestThreshold?: number;
  /** Fields whose values are replaced by '[Filtered]' before sending. Case-insensitive. */
  denyList?: string[];
  /** Endpoint for performance events. Defaults to endpoint with /ingest → /performance. */
  performanceEndpoint?: string;
  beforeSend?: (event: ErrorPayload) => ErrorPayload | null;
}

export type ResolvedConfig = Required<ErrorTrackerConfig>;

const DEFAULT_DENY_LIST = [
  'password', 'passwd', 'secret', 'token', 'authorization',
  'cookie', 'credit_card', 'creditcard', 'cvv', 'ssn', 'document',
];

export function resolveConfig(config: ErrorTrackerConfig): ResolvedConfig {
  return {
    environment: 'production',
    version: 'unknown',
    release: 'unknown',
    userId: '',
    sampleRate: 1,
    maxBreadcrumbs: 50,
    enablePerformance: false,
    enableConsoleCapture: false,
    enableHttpTracking: true,
    slowRequestThreshold: 2000,
    denyList: DEFAULT_DENY_LIST,
    performanceEndpoint: config.endpoint.replace(/\/api\/v1\/ingest$/, '/api/v1/performance'),
    beforeSend: (e) => e,
    ...config,
  };
}
