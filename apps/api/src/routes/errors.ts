import type { FastifyInstance } from 'fastify';

interface ErrorGroupQuery {
  status?: string;
  environment?: string;
  page?: string;
  limit?: string;
}

export async function errorRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { projectId: string }; Querystring: ErrorGroupQuery }>(
    '/api/v1/projects/:projectId/errors',
    async (request, reply) => {
      const { projectId } = request.params;
      const {
        status,
        environment,
        page = '1',
        limit = '50',
      } = request.query;

      const skip = (Number(page) - 1) * Number(limit);

      const where = {
        projectId,
        ...(status ? { status: status as 'open' | 'resolved' | 'ignored' } : {}),
        ...(environment ? { environment } : {}),
      };

      const [groups, total] = await Promise.all([
        app.prisma.errorGroup.findMany({
          where,
          orderBy: { lastSeenAt: 'desc' },
          skip,
          take: Number(limit),
          select: {
            id: true,
            fingerprint: true,
            title: true,
            message: true,
            status: true,
            environment: true,
            firstSeenAt: true,
            lastSeenAt: true,
            totalOccurrences: true,
            affectedUsers: true,
          },
        }),
        app.prisma.errorGroup.count({ where }),
      ]);

      return reply.send({ data: groups, total, page: Number(page), limit: Number(limit) });
    }
  );

  app.get<{ Params: { projectId: string; groupId: string } }>(
    '/api/v1/projects/:projectId/errors/:groupId',
    async (request, reply) => {
      const { projectId, groupId } = request.params;

      const group = await app.prisma.errorGroup.findFirst({
        where: { id: groupId, projectId },
      });

      if (!group) return reply.status(404).send({ error: 'Not found' });

      return reply.send(group);
    }
  );

  app.get<{ Params: { projectId: string; groupId: string } }>(
    '/api/v1/projects/:projectId/errors/:groupId/events',
    async (request, reply) => {
      const { projectId, groupId } = request.params;

      const events = await app.prisma.errorEvent.findMany({
        where: { groupId, projectId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          sessionId: true,
          userId: true,
          url: true,
          message: true,
          stack: true,
          desminifiedStack: true,
          browser: true,
          breadcrumbs: true,
          metadata: true,
          environment: true,
          version: true,
          createdAt: true,
        },
      });

      return reply.send(events);
    }
  );

  app.patch<{
    Params: { projectId: string; groupId: string };
    Body: { status: 'open' | 'resolved' | 'ignored' };
  }>(
    '/api/v1/projects/:projectId/errors/:groupId',
    {
      schema: {
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['open', 'resolved', 'ignored'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId, groupId } = request.params;
      const { status } = request.body;

      const updated = await app.prisma.errorGroup.updateMany({
        where: { id: groupId, projectId },
        data: { status },
      });

      if (updated.count === 0) return reply.status(404).send({ error: 'Not found' });

      return reply.send({ ok: true });
    }
  );

  // GET /api/v1/projects/:projectId/errors/:groupId/histogram
  app.get<{ Params: { projectId: string; groupId: string } }>(
    '/api/v1/projects/:projectId/errors/:groupId/histogram',
    async (request, reply) => {
      const { projectId, groupId } = request.params;

      type Row = { date: string; count: number };

      const rows = await app.prisma.$queryRaw<Row[]>`
        SELECT
          to_char(day::date, 'YYYY-MM-DD') AS date,
          COALESCE(COUNT(e.id), 0)::int     AS count
        FROM generate_series(
          (NOW() - INTERVAL '29 days')::date,
          NOW()::date,
          INTERVAL '1 day'
        ) AS day
        LEFT JOIN "ErrorEvent" e
          ON DATE_TRUNC('day', e."createdAt") = day::date
          AND e."groupId"   = ${groupId}
          AND e."projectId" = ${projectId}
        GROUP BY day
        ORDER BY day ASC
      `;

      return reply.send({ data: rows });
    }
  );
}
