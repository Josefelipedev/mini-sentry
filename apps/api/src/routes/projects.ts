import type { FastifyInstance } from 'fastify';

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/v1/projects', async (_request, reply) => {
    const projects = await app.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        apiKey: true,
        allowedOrigins: true,
        createdAt: true,
      },
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
        select: { id: true, name: true, apiKey: true, allowedOrigins: true, createdAt: true },
      });
      return reply.status(201).send(project);
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
