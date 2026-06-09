import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import {
  signToken,
  verifyToken,
  buildCookieHeader,
  clearCookieHeader,
  COOKIE_NAME,
} from '../lib/jwt';

const BCRYPT_ROUNDS = 12;

function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((pair) => {
      const idx = pair.indexOf('=');
      if (idx === -1) return [pair.trim(), ''];
      return [pair.slice(0, idx).trim(), decodeURIComponent(pair.slice(idx + 1).trim())];
    })
  );
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/auth/setup — checks whether any user exists
  app.get('/api/v1/auth/setup', async (_req, reply) => {
    const count = await app.prisma.user.count();
    return reply.send({ hasUsers: count > 0 });
  });

  // POST /api/v1/auth/setup — create the first owner (only when no users exist)
  app.post<{ Body: { email: string; password: string; name?: string } }>(
    '/api/v1/auth/setup',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name:     { type: 'string', maxLength: 100 },
          },
        },
      },
    },
    async (request, reply) => {
      const count = await app.prisma.user.count();
      if (count > 0) {
        return reply.status(409).send({ error: 'Setup already complete' });
      }

      const { email, password, name } = request.body;
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      const user = await app.prisma.user.create({
        data: { email, passwordHash, name, role: 'owner' },
        select: { id: true, email: true, name: true, role: true },
      });

      const token = await signToken({ sub: user.id, email: user.email, role: user.role });
      return reply
        .header('Set-Cookie', buildCookieHeader(token))
        .status(201)
        .send({ user });
    }
  );

  // POST /api/v1/auth/login — rate-limited to 10 req/15 min per IP
  app.post<{ Body: { email: string; password: string } }>(
    '/api/v1/auth/login',
    {
      config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      const user = await app.prisma.user.findUnique({ where: { email } });

      // Use a constant-time dummy hash when user not found to prevent timing attacks
      const hash = user?.passwordHash ?? '$2b$12$invalidhashfortimingprotection';
      const valid = await bcrypt.compare(password, hash);

      if (!user || !valid) {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }

      const token = await signToken({ sub: user.id, email: user.email, role: user.role });
      return reply
        .header('Set-Cookie', buildCookieHeader(token))
        .send({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
  );

  // POST /api/v1/auth/logout
  app.post('/api/v1/auth/logout', async (_req, reply) => {
    return reply.header('Set-Cookie', clearCookieHeader()).send({ ok: true });
  });

  // GET /api/v1/auth/me
  app.get('/api/v1/auth/me', async (request, reply) => {
    const cookies = parseCookies(request.headers.cookie);
    const token =
      cookies[COOKIE_NAME] ??
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const payload = await verifyToken(token);
      const user = await app.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true },
      });
      if (!user) return reply.status(401).send({ error: 'User not found' });
      return reply.send(user);
    } catch {
      return reply.status(401).send({ error: 'Invalid session' });
    }
  });
}
