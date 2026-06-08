export interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  language: string;
  viewport: { width: number; height: number };
  timezone: string;
}

export interface BreadcrumbEntry {
  type: 'navigation' | 'click' | 'http' | 'console' | 'manual';
  category: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export type PerfRating = 'good' | 'needs-improvement' | 'poor';

export interface ErrorPayload {
  apiKey: string;
  appName: string;
  environment: string;
  version?: string;
  release?: string;
  sessionId: string;
  userId?: string;
  fingerprint: string;
  type: 'error' | 'message' | 'promise' | 'http';
  message: string;
  stack?: string;
  filename?: string;
  line?: number;
  column?: number;
  url: string;
  browser: BrowserInfo;
  breadcrumbs: BreadcrumbEntry[];
  metadata?: Record<string, unknown>;
  timestamp: number;
}
