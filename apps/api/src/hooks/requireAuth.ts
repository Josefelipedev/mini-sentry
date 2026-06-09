import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, COOKIE_NAME, type AuthPayload } from '../lib/jwt';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthPayload;
  }
}

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

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const cookies = parseCookies(request.headers.cookie);
  const token =
    cookies[COOKIE_NAME] ??
    request.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  try {
    request.user = await verifyToken(token);
  } catch {
    reply.status(401).send({ error: 'Invalid or expired session' });
  }
}
