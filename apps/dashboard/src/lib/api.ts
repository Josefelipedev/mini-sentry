import type { ErrorGroupDTO, ErrorEventDTO, ProjectDTO, PerformanceSummary } from '@mini-sentry/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export function buildApiClient(cookieHeader?: string) {
  const extraHeaders: Record<string, string> = {};
  if (cookieHeader) extraHeaders['Cookie'] = cookieHeader;

  async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      cache: 'no-store',
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  return {
    projects: {
      list: () => apiFetch<ProjectDTO[]>('/api/v1/projects'),
      create: (body: { name: string; allowedOrigins?: string[] }) =>
        apiFetch<ProjectDTO>('/api/v1/projects', {
          method: 'POST',
          body: JSON.stringify(body),
        }),
      updateAlerts: (
        projectId: string,
        body: { alertWebhookUrl?: string | null; alertEmail?: string | null }
      ) =>
        apiFetch<ProjectDTO>(`/api/v1/projects/${projectId}/alerts`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        }),
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
        return apiFetch<{ data: ErrorGroupDTO[]; total: number; page: number; limit: number }>(
          `/api/v1/projects/${projectId}/errors?${qs}`
        );
      },
      get: (projectId: string, groupId: string) =>
        apiFetch<ErrorGroupDTO>(`/api/v1/projects/${projectId}/errors/${groupId}`),
      events: (projectId: string, groupId: string) =>
        apiFetch<ErrorEventDTO[]>(`/api/v1/projects/${projectId}/errors/${groupId}/events`),
      updateStatus: (
        projectId: string,
        groupId: string,
        status: 'open' | 'resolved' | 'ignored'
      ) =>
        apiFetch<{ ok: boolean }>(`/api/v1/projects/${projectId}/errors/${groupId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      histogram: (projectId: string, groupId: string) =>
        apiFetch<{ data: { date: string; count: number }[] }>(
          `/api/v1/projects/${projectId}/errors/${groupId}/histogram`
        ),
    },
    performance: {
      summary: (projectId: string, days = 7) =>
        apiFetch<PerformanceSummary>(`/api/v1/projects/${projectId}/performance?days=${days}`),
    },
    releases: {
      list: (projectId: string) =>
        apiFetch<{ version: string; files: number }[]>(
          `/api/v1/projects/${projectId}/releases`
        ),
      listFiles: (projectId: string, version: string) =>
        apiFetch<{ id: string; filename: string; createdAt: string }[]>(
          `/api/v1/projects/${projectId}/releases/${encodeURIComponent(version)}/sourcemaps`
        ),
      deleteVersion: (projectId: string, version: string) =>
        apiFetch<void>(
          `/api/v1/projects/${projectId}/releases/${encodeURIComponent(version)}/sourcemaps`,
          { method: 'DELETE' }
        ),
    },
  };
}

// Default client for client components (browser sends cookie automatically via credentials:include)
export const api = buildApiClient();
