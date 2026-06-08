import { TraceMap, originalPositionFor } from '@jridgewell/trace-mapping';
import type { PrismaClient } from '@prisma/client';

interface StackFrame {
  functionName: string;
  filename: string;
  line: number;
  column: number;
  raw: string;
}

// In-memory cache for parsed source maps — keyed by "projectId:version:filename"
const MAX_CACHE = 200;
const tracerCache = new Map<string, TraceMap>();

function cacheSet(key: string, tracer: TraceMap): void {
  if (tracerCache.size >= MAX_CACHE) {
    tracerCache.delete(tracerCache.keys().next().value as string);
  }
  tracerCache.set(key, tracer);
}

export function invalidateCache(projectId: string, version: string): void {
  for (const key of tracerCache.keys()) {
    if (key.startsWith(`${projectId}:${version}:`)) {
      tracerCache.delete(key);
    }
  }
}

async function getTracer(
  prisma: PrismaClient,
  projectId: string,
  version: string,
  filename: string
): Promise<TraceMap | null> {
  const normalized = normalizeFilename(filename);
  const key = `${projectId}:${version}:${normalized}`;

  if (tracerCache.has(key)) return tracerCache.get(key)!;

  const row = await prisma.sourceMap.findFirst({
    where: {
      projectId,
      version,
      OR: [{ filename: normalized }, { filename: filename }],
    },
    select: { content: true },
  });

  if (!row) return null;

  try {
    const tracer = new TraceMap(row.content);
    cacheSet(key, tracer);
    return tracer;
  } catch {
    return null;
  }
}

export async function desminifyStack(
  prisma: PrismaClient,
  projectId: string,
  version: string,
  stack: string
): Promise<string> {
  // Quick check: do we have any source maps for this project+version?
  const count = await prisma.sourceMap.count({ where: { projectId, version } });
  if (count === 0) return stack;

  const lines = stack.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const frame = parseFrame(line);
    if (!frame) {
      result.push(line);
      continue;
    }

    const tracer = await getTracer(prisma, projectId, version, frame.filename);
    if (!tracer) {
      result.push(line);
      continue;
    }

    try {
      const orig = originalPositionFor(tracer, {
        line: frame.line,
        column: frame.column,
      });

      if (orig.source != null) {
        const name = orig.name ?? frame.functionName;
        const display = name !== '<anonymous>' ? name : '<anonymous>';
        result.push(
          `    at ${display} (${orig.source}:${orig.line}:${orig.column})`
        );
      } else {
        result.push(line);
      }
    } catch {
      result.push(line);
    }
  }

  return result.join('\n');
}

function parseFrame(line: string): StackFrame | null {
  // V8: "    at funcName (https://cdn.example.com/app.js:1:500)"
  // V8: "    at https://cdn.example.com/app.js:1:500"
  const match = line.match(/^\s*at\s+(?:(.+?)\s+\()?(.+?):(\d+):(\d+)\)?$/);
  if (!match) return null;
  return {
    functionName: match[1]?.trim() ?? '<anonymous>',
    filename: match[2].trim(),
    line: Number(match[3]),
    column: Number(match[4]),
    raw: line,
  };
}

function normalizeFilename(filename: string): string {
  // Strip webpack:// protocol
  if (filename.startsWith('webpack://')) {
    filename = filename.replace(/^webpack:\/\/[^/]*\//, '');
  }

  // For URLs, try full pathname first, then just the basename
  try {
    const url = new URL(filename);
    // Return the basename so it matches how the CLI uploads (just the filename)
    return url.pathname.split('/').filter(Boolean).pop() ?? filename;
  } catch {
    return filename.split('/').filter(Boolean).pop() ?? filename;
  }
}
