import type { FastifyInstance } from 'fastify';

const PROJECT_SELECT = {
  id: true,
  name: true,
  apiKey: true,
  allowedOrigins: true,
  alertWebhookUrl: true,
  alertEmail: true,
  createdAt: true,
} as const;

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/projects', async (_request, reply) => {
    const projects = await app.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: PROJECT_SELECT,
    });
    return reply.send(projects);
  });

  app.post<{ Body: { name: string; allowedOrigins?: string[] } }>(
    '/api/v1/projects',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            allowedOrigins: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, allowedOrigins = [] } = request.body;
      const project = await app.prisma.project.create({
        data: { name, allowedOrigins },
        select: PROJECT_SELECT,
      });
      return reply.status(201).send(project);
    }
  );

  app.patch<{
    Params: { projectId: string };
    Body: { alertWebhookUrl?: string | null; alertEmail?: string | null };
  }>(
    '/api/v1/projects/:projectId/alerts',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            alertWebhookUrl: { type: ['string', 'null'] },
            alertEmail: { type: ['string', 'null'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const { alertWebhookUrl, alertEmail } = request.body;

      const project = await app.prisma.project.update({
        where: { id: projectId },
        data: {
          ...(alertWebhookUrl !== undefined ? { alertWebhookUrl: alertWebhookUrl ?? null } : {}),
          ...(alertEmail !== undefined ? { alertEmail: alertEmail ?? null } : {}),
        },
        select: PROJECT_SELECT,
      });
      return reply.send(project);
    }
  );

  app.delete<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId',
    async (request, reply) => {
      await app.prisma.project.delete({ where: { id: request.params.projectId } });
      return reply.status(204).send();
    }
  );
}
