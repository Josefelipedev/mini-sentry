import type { FastifyInstance } from 'fastify';
import type { PerformancePayload } from '@mini-sentry/shared';
import { PerfType, PerfRating } from '@prisma/client';

const typeMap: Record<string, PerfType> = {
  'web-vital': PerfType.web_vital,
  'http':      PerfType.http,
  'navigation': PerfType.navigation,
};

const ratingMap: Record<string, PerfRating> = {
  'good':              PerfRating.good,
  'needs-improvement': PerfRating.needs_improvement,
  'poor':              PerfRating.poor,
};

export async function performanceIngestRoute(app: FastifyInstance): Promise<void> {
  // POST /api/v1/performance — receives events from the SDK
  app.post<{ Body: PerformancePayload }>(
    '/api/v1/performance',
    {
      schema: {
        body: {
          type: 'object',
          required: ['apiKey', 'sessionId', 'type', 'name', 'value', 'rating'],
          properties: {
            apiKey:      { type: 'string' },
            sessionId:   { type: 'string' },
            url:         { type: 'string', maxLength: 2048 },
            type:        { type: 'string', enum: ['web-vital', 'http', 'navigation'] },
            name:        { type: 'string', maxLength: 255 },
            value:       { type: 'number' },
            rating:      { type: 'string', enum: ['good', 'needs-improvement', 'poor'] },
            version:     { type: 'string', maxLength: 100 },
            environment: { type: 'string', maxLength: 50 },
            timestamp:   { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const payload = request.body;

      const project = await app.prisma.project.findUnique({
        where: { apiKey: payload.apiKey },
        select: { id: true, allowedOrigins: true },
      });
      if (!project) return reply.status(401).send({ error: 'Invalid API key' });

      const origin = request.headers.origin;
      if (project.allowedOrigins.length > 0 && origin) {
        const allowed = project.allowedOrigins.some((o) => origin.startsWith(o));
        if (!allowed) return reply.status(403).send({ error: 'Origin not allowed' });
      }

      await app.prisma.performanceEvent.create({
        data: {
          projectId:   project.id,
          sessionId:   payload.sessionId,
          url:         payload.url,
          type:        typeMap[payload.type] ?? PerfType.http,
          name:        payload.name,
          value:       payload.value,
          rating:      ratingMap[payload.rating] ?? PerfRating.good,
          version:     payload.version,
          environment: payload.environment ?? 'production',
        },
      });

      return reply.status(202).send({ ok: true });
    }
  );
}

export async function performanceReadRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/projects/:projectId/performance?days=7
  app.get<{
    Params: { projectId: string };
    Querystring: { days?: string };
  }>(
    '/api/v1/projects/:projectId/performance',
    async (request, reply) => {
      const { projectId } = request.params;
      const days = Math.min(Number(request.query.days ?? 7), 90);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [webVitalRows, httpRows] = await Promise.all([
        // Web Vitals grouped by name
        app.prisma.performanceEvent.groupBy({
          by: ['name', 'rating'],
          where: { projectId, type: PerfType.web_vital, createdAt: { gte: since } },
          _avg: { value: true },
          _count: { value: true },
          orderBy: { name: 'asc' },
        }),
        // HTTP events for slow APIs and errors
        app.prisma.performanceEvent.findMany({
          where: { projectId, type: PerfType.http, createdAt: { gte: since } },
          select: { name: true, value: true, rating: true },
          orderBy: { createdAt: 'desc' },
          take: 10_000,
        }),
      ]);

      // Aggregate web vitals — dominant rating by count
      const vitalMap = new Map<string, { totalValue: number; count: number; ratingCounts: Record<string, number> }>();
      for (const row of webVitalRows) {
        const entry = vitalMap.get(row.name) ?? { totalValue: 0, count: 0, ratingCounts: {} };
        entry.totalValue += (row._avg.value ?? 0) * row._count.value;
        entry.count += row._count.value;
        entry.ratingCounts[row.rating] = (entry.ratingCounts[row.rating] ?? 0) + row._count.value;
        vitalMap.set(row.name, entry);
      }

      const webVitals = Array.from(vitalMap.entries()).map(([name, d]) => {
        const avg = d.count > 0 ? d.totalValue / d.count : 0;
        const dominant = Object.entries(d.ratingCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'good';
        const ratingOut = dominant === 'needs_improvement' ? 'needs-improvement' : dominant;
        return { name, avg: Math.round(avg * 100) / 100, rating: ratingOut, count: d.count };
      });

      // Slow APIs — group by endpoint name
      const apiMap = new Map<string, number[]>();
      for (const row of httpRows) {
        const list = apiMap.get(row.name) ?? [];
        list.push(row.value);
        apiMap.set(row.name, list);
      }

      const slowestApis = Array.from(apiMap.entries())
        .map(([name, values]) => {
          values.sort((a, b) => a - b);
          const avg = values.reduce((s, v) => s + v, 0) / values.length;
          const p95 = values[Math.floor(values.length * 0.95)] ?? values[values.length - 1];
          return { name, avg: Math.round(avg), p95: Math.round(p95 ?? 0), count: values.length };
        })
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 20);

      // HTTP errors (poor rating = failed / very slow)
      const errorMap = new Map<string, number>();
      for (const row of httpRows) {
        if (row.rating === PerfRating.poor) {
          errorMap.set(row.name, (errorMap.get(row.name) ?? 0) + 1);
        }
      }

      const httpErrors = Array.from(errorMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return reply.send({ webVitals, slowestApis, httpErrors });
    }
  );
}
