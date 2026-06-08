import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { prisma } from './lib/prisma';
import { createRedisClient } from './lib/redis';
import { ingestRoutes } from './routes/ingest';
import { projectRoutes } from './routes/projects';
import { errorRoutes } from './routes/errors';
import { sourcemapRoutes } from './routes/sourcemaps';
import { performanceRoutes } from './routes/performance';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  const redis = createRedisClient();
  await redis.connect();

  await app.register(cors, {
    origin: [
      process.env.DASHBOARD_ORIGIN ?? 'http://localhost:3000',
      /^null$/, // allow file:// for testing
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.register(rateLimit, {
    redis,
    global: true,
    max: Number(process.env.API_RATE_LIMIT_MAX ?? 200),
    timeWindow: Number(process.env.API_RATE_LIMIT_WINDOW_MS ?? 60_000),
    keyGenerator: (req) => req.headers['x-forwarded-for'] as string ?? req.ip,
    errorResponseBuilder: () => ({
      error: 'Too many requests',
      statusCode: 429,
    }),
  });

  // Stricter rate limit for ingestion + performance endpoints
  await app.register(
    async (instance) => {
      await instance.register(rateLimit, {
        redis,
        max: Number(process.env.INGEST_RATE_LIMIT_MAX ?? 500),
        timeWindow: Number(process.env.INGEST_RATE_LIMIT_WINDOW_MS ?? 60_000),
        keyGenerator: (req) => {
          const body = req.body as { apiKey?: string } | null;
          return body?.apiKey ?? req.ip;
        },
      });

      await instance.register(ingestRoutes);
      await instance.register(performanceRoutes);
    },
    { prefix: '/' }
  );

  app.decorate('prisma', prisma);

  await app.register(projectRoutes);
  await app.register(errorRoutes);
  await app.register(sourcemapRoutes);

  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    redis.disconnect();
  });

  return app;
}
