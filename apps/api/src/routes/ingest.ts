import type { FastifyInstance } from 'fastify';
import type { ErrorPayload } from '@mini-sentry/shared';
import { upsertErrorGroup } from '../services/grouping';

export async function ingestRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: ErrorPayload }>(
    '/api/v1/ingest',
    {
      schema: {
        body: {
          type: 'object',
          required: ['apiKey', 'appName', 'message', 'fingerprint', 'sessionId'],
          properties: {
            apiKey: { type: 'string' },
            appName: { type: 'string', maxLength: 100 },
            message: { type: 'string', maxLength: 5000 },
            fingerprint: { type: 'string', maxLength: 64 },
            sessionId: { type: 'string' },
            environment: { type: 'string', maxLength: 50 },
            version: { type: 'string', maxLength: 50 },
            release: { type: 'string', maxLength: 100 },
            userId: { type: 'string', maxLength: 255 },
            type: { type: 'string', enum: ['error', 'message', 'promise', 'http'] },
            stack: { type: 'string', maxLength: 50000 },
            url: { type: 'string', maxLength: 2048 },
            browser: { type: 'object' },
            breadcrumbs: { type: 'array' },
            metadata: { type: 'object' },
            timestamp: { type: 'number' },
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

      if (!project) {
        return reply.status(401).send({ error: 'Invalid API key' });
      }

      const origin = request.headers.origin;
      if (project.allowedOrigins.length > 0 && origin) {
        const allowed = project.allowedOrigins.some((o) =>
          origin.startsWith(o)
        );
        if (!allowed) {
          return reply.status(403).send({ error: 'Origin not allowed' });
        }
      }

      await upsertErrorGroup(app.prisma, project.id, payload);

      return reply.status(202).send({ ok: true });
    }
  );
}
