import type { ErrorGroupDTO, ErrorEventDTO, ProjectDTO, PerformanceSummary } from '@mini-sentry/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`API ${res.status}: ${path}`);
}

export const api = {
  projects: {
    list: () => get<ProjectDTO[]>('/api/v1/projects'),
    create: (body: { name: string; allowedOrigins?: string[] }) =>
      post<ProjectDTO>('/api/v1/projects', body),
    updateAlerts: (
      projectId: string,
      body: { alertWebhookUrl?: string | null; alertEmail?: string | null }
    ) => patch<ProjectDTO>(`/api/v1/projects/${projectId}/alerts`, body),
  },
  errors: {
    list: (
      projectId: string,
      params?: { status?: string; environment?: string; page?: number }
    ) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.environment) qs.set('environment', params.environment);
      if (params?.page) qs.set('page', String(params.page));
      return get<{ data: ErrorGroupDTO[]; total: number; page: number; limit: number }>(
        `/api/v1/projects/${projectId}/errors?${qs}`
      );
    },
    get: (projectId: string, groupId: string) =>
      get<ErrorGroupDTO>(`/api/v1/projects/${projectId}/errors/${groupId}`),
    events: (projectId: string, groupId: string) =>
      get<ErrorEventDTO[]>(
        `/api/v1/projects/${projectId}/errors/${groupId}/events`
      ),
    updateStatus: (
      projectId: string,
      groupId: string,
      status: 'open' | 'resolved' | 'ignored'
    ) =>
      patch<{ ok: boolean }>(
        `/api/v1/projects/${projectId}/errors/${groupId}`,
        { status }
      ),
    histogram: (projectId: string, groupId: string) =>
      get<{ data: { date: string; count: number }[] }>(
        `/api/v1/projects/${projectId}/errors/${groupId}/histogram`
      ),
  },
  performance: {
    summary: (projectId: string, days = 7) =>
      get<PerformanceSummary>(`/api/v1/projects/${projectId}/performance?days=${days}`),
  },
  releases: {
    list: (projectId: string) =>
      get<{ version: string; files: number }[]>(`/api/v1/projects/${projectId}/releases`),
    listFiles: (projectId: string, version: string) =>
      get<{ id: string; filename: string; createdAt: string }[]>(
        `/api/v1/projects/${projectId}/releases/${encodeURIComponent(version)}/sourcemaps`
      ),
    deleteVersion: (projectId: string, version: string) =>
      del(`/api/v1/projects/${projectId}/releases/${encodeURIComponent(version)}/sourcemaps`),
  },
};
