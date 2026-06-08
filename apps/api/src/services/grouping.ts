import type { PrismaClient } from '@prisma/client';
import type { ErrorPayload } from '@mini-sentry/shared';
import { desminifyStack } from './desminify';

export async function upsertErrorGroup(
  prisma: PrismaClient,
  projectId: string,
  payload: ErrorPayload
): Promise<void> {
  const environment = payload.environment ?? 'production';
  const title = payload.message.slice(0, 255);

  const group = await prisma.errorGroup.upsert({
    where: {
      projectId_fingerprint_environment: {
        projectId,
        fingerprint: payload.fingerprint,
        environment,
      },
    },
    create: {
      projectId,
      fingerprint: payload.fingerprint,
      title,
      message: payload.message,
      environment,
      totalOccurrences: 1,
      affectedUsers: payload.userId ? [payload.userId] : [],
    },
    update: {
      lastSeenAt: new Date(),
      totalOccurrences: { increment: 1 },
    },
    select: { id: true, affectedUsers: true },
  });

  // Add userId to affectedUsers without duplicates
  if (payload.userId && !group.affectedUsers.includes(payload.userId)) {
    await prisma.errorGroup.update({
      where: { id: group.id },
      data: { affectedUsers: { push: payload.userId } },
    });
  }

  // Attempt source map desminification asynchronously — never blocks ingest
  let desminifiedStack: string | undefined;
  if (payload.stack && payload.version) {
    try {
      const result = await desminifyStack(
        prisma,
        projectId,
        payload.version,
        payload.stack
      );
      if (result !== payload.stack) desminifiedStack = result;
    } catch {
      // ignore — original stack is always preserved
    }
  }

  await prisma.errorEvent.create({
    data: {
      groupId: group.id,
      projectId,
      sessionId: payload.sessionId,
      userId: payload.userId,
      url: payload.url,
      message: payload.message,
      stack: payload.stack,
      desminifiedStack,
      browser: payload.browser as object,
      breadcrumbs: payload.breadcrumbs as object,
      metadata: (payload.metadata as object) ?? undefined,
      environment,
      version: payload.version,
    },
  });
}
