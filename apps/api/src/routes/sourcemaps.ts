import type { FastifyInstance } from 'fastify';
import { invalidateCache } from '../services/desminify';

interface UploadBody {
  filename: string;
  content: string;
}

export async function sourcemapRoutes(app: FastifyInstance): Promise<void> {
  // Shared auth helper
  const resolveProject = async (apiKey: string | undefined) => {
    if (!apiKey) return null;
    return app.prisma.project.findUnique({
      where: { apiKey },
      select: { id: true, name: true },
    });
  };

  // POST /api/v1/releases/:version/sourcemaps
  // Used by the CLI during deploy. Auth via x-api-key header.
  app.post<{
    Params: { version: string };
    Body: UploadBody;
  }>(
    '/api/v1/releases/:version/sourcemaps',
    {
      schema: {
        params: {
          type: 'object',
          required: ['version'],
          properties: { version: { type: 'string', maxLength: 100 } },
        },
        body: {
          type: 'object',
          required: ['filename', 'content'],
          properties: {
            filename: { type: 'string', maxLength: 255 },
            content: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const apiKey = request.headers['x-api-key'] as string | undefined;
      const project = await resolveProject(apiKey);
      if (!project) return reply.status(401).send({ error: 'Invalid or missing x-api-key' });

      const { version } = request.params;
      const { filename, content } = request.body;

      // Validate it looks like a source map
      try {
        const parsed = JSON.parse(content) as Record<string, unknown>;
        if (parsed.version !== 3 || !parsed.mappings) {
          return reply.status(400).send({ error: 'Not a valid Source Map v3' });
        }
      } catch {
        return reply.status(400).send({ error: 'content must be valid JSON' });
      }

      await app.prisma.sourceMap.upsert({
        where: {
          projectId_version_filename: {
            projectId: project.id,
            version,
            filename,
          },
        },
        create: { projectId: project.id, version, filename, content },
        update: { content },
      });

      // Invalidate the in-memory tracer cache for this version
      invalidateCache(project.id, version);

      return reply.status(201).send({ ok: true, project: project.name, version, filename });
    }
  );

  // GET /api/v1/projects/:projectId/releases — list versions that have source maps
  app.get<{ Params: { projectId: string } }>(
    '/api/v1/projects/:projectId/releases',
    async (request, reply) => {
      const { projectId } = request.params;

      const rows = await app.prisma.sourceMap.groupBy({
        by: ['version'],
        where: { projectId },
        _count: { filename: true },
        orderBy: { version: 'desc' },
      });

      return reply.send(
        rows.map((r) => ({ version: r.version, files: r._count.filename }))
      );
    }
  );

  // GET /api/v1/projects/:projectId/releases/:version/sourcemaps — list files
  app.get<{ Params: { projectId: string; version: string } }>(
    '/api/v1/projects/:projectId/releases/:version/sourcemaps',
    async (request, reply) => {
      const { projectId, version } = request.params;

      const maps = await app.prisma.sourceMap.findMany({
        where: { projectId, version },
        select: { id: true, filename: true, createdAt: true },
        orderBy: { filename: 'asc' },
      });

      return reply.send(maps);
    }
  );

  // DELETE /api/v1/projects/:projectId/releases/:version/sourcemaps — delete all for a version
  app.delete<{ Params: { projectId: string; version: string } }>(
    '/api/v1/projects/:projectId/releases/:version/sourcemaps',
    async (request, reply) => {
      const { projectId, version } = request.params;

      await app.prisma.sourceMap.deleteMany({ where: { projectId, version } });
      invalidateCache(projectId, version);

      return reply.status(204).send();
    }
  );
}
