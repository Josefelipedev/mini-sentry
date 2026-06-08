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

export interface ErrorGroupDTO {
  id: string;
  projectId: string;
  fingerprint: string;
  title: string;
  message: string;
  status: 'open' | 'resolved' | 'ignored';
  environment: string;
  firstSeenAt: string;
  lastSeenAt: string;
  totalOccurrences: number;
  affectedUsers: string[];
}

export interface ErrorEventDTO {
  id: string;
  groupId: string;
  sessionId: string | null;
  userId: string | null;
  url: string | null;
  message: string;
  stack: string | null;
  desminifiedStack: string | null;
  browser: BrowserInfo | null;
  breadcrumbs: BreadcrumbEntry[] | null;
  metadata: Record<string, unknown> | null;
  environment: string;
  version: string | null;
  createdAt: string;
}

export interface ProjectDTO {
  id: string;
  name: string;
  apiKey: string;
  allowedOrigins: string[];
  alertWebhookUrl: string | null;
  alertEmail: string | null;
  createdAt: string;
}

export type PerfRating = 'good' | 'needs-improvement' | 'poor';

export interface PerformancePayload {
  apiKey: string;
  sessionId: string;
  url: string;
  type: 'web-vital' | 'http' | 'navigation';
  name: string;
  value: number;
  rating: PerfRating;
  version?: string;
  environment: string;
  timestamp: number;
}

export interface WebVitalSummary {
  name: string;
  avg: number;
  rating: PerfRating;
  count: number;
}

export interface SlowApiSummary {
  name: string;
  avg: number;
  p95: number;
  count: number;
}

export interface PerformanceSummary {
  webVitals: WebVitalSummary[];
  slowestApis: SlowApiSummary[];
  httpErrors: { name: string; count: number }[];
}
