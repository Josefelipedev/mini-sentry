import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import { StatusBadge } from '@/components/StatusBadge';
import { BreadcrumbList } from '@/components/BreadcrumbList';
import { OccurrenceHistogram } from '@/components/OccurrenceHistogram';
import type { BreadcrumbEntry, BrowserInfo } from '@mini-sentry/shared';

interface Props {
  params: Promise<{ projectId: string; groupId: string }>;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default async function ErrorDetailPage({ params }: Props) {
  const { projectId, groupId } = await params;
  const api = await serverApi();

  let group;
  let events;
  let histogramData: { data: { date: string; count: number }[] } = { data: [] };

  try {
    [group, events, histogramData] = await Promise.all([
      api.errors.get(projectId, groupId),
      api.errors.events(projectId, groupId),
      api.errors.histogram(projectId, groupId),
    ]);
  } catch {
    notFound();
  }

  const latestEvent = events[0] ?? null;
  const browser = latestEvent?.browser as BrowserInfo | null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
      {/* Breadcrumb nav */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-300">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-gray-300">
          {projectId.slice(0, 8)}…
        </Link>
        <span>/</span>
        <span className="text-gray-400">Error</span>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-mono text-lg text-red-400 break-all">{group.title}</h1>
          <StatusBadge status={group.status} />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>First seen: {fmtDate(group.firstSeenAt)}</span>
          <span>Last seen: {fmtDate(group.lastSeenAt)}</span>
          <span>
            <strong className="text-gray-300">{group.totalOccurrences.toLocaleString()}</strong> occurrences
          </span>
          <span>
            <strong className="text-gray-300">{group.affectedUsers.length}</strong> users affected
          </span>
          <span className="font-mono text-xs bg-gray-800 px-2 py-0.5 rounded">
            {group.environment}
          </span>
        </div>
      </div>

      {/* Occurrence histogram */}
      {histogramData.data.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Occurrences — last 30 days
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <OccurrenceHistogram data={histogramData.data} />
          </div>
        </section>
      )}

      {/* Stack trace — prefer desminified when available */}
      {latestEvent?.stack && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Stack trace
            </h2>
            {latestEvent.desminifiedStack && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-900/50 px-2.5 py-0.5 text-xs text-green-400 border border-green-800">
                ✓ desminified via source map
              </span>
            )}
          </div>

          {latestEvent.desminifiedStack ? (
            <>
              <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-green-300 leading-relaxed whitespace-pre-wrap break-all">
                {latestEvent.desminifiedStack}
              </pre>
              <details className="mt-2">
                <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400">
                  Show minified original
                </summary>
                <pre className="mt-2 bg-gray-900 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-500 leading-relaxed whitespace-pre-wrap break-all">
                  {latestEvent.stack}
                </pre>
              </details>
            </>
          ) : (
            <>
              <pre className="bg-gray-800 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-300 leading-relaxed whitespace-pre-wrap break-all">
                {latestEvent.stack}
              </pre>
              {latestEvent.version && (
                <p className="mt-2 text-xs text-gray-600">
                  No source maps uploaded for version{' '}
                  <span className="font-mono text-gray-500">{latestEvent.version}</span>.
                  Run <span className="font-mono text-gray-400">npx @mini-sentry/cli sourcemaps --version {latestEvent.version} --dir ./dist --api-key &lt;key&gt; --api-url &lt;url&gt;</span> after your build.
                </p>
              )}
            </>
          )}
        </section>
      )}

      {/* Browser & session */}
      {browser && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Environment
          </h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[
              ['Browser', `${browser.name} ${browser.version}`],
              ['OS', browser.os],
              ['Language', browser.language],
              ['Timezone', browser.timezone],
              ['Viewport', `${browser.viewport.width}×${browser.viewport.height}`],
              ['URL', latestEvent.url ?? '—'],
              ['Version', latestEvent.version ?? '—'],
              ['User', latestEvent.userId ?? 'anonymous'],
            ].map(([label, value]) => (
              <div key={label} className="bg-gray-800 rounded p-3">
                <dt className="text-gray-500 text-xs">{label}</dt>
                <dd className="text-gray-200 font-mono text-xs mt-1 break-all">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* Breadcrumbs */}
      {latestEvent?.breadcrumbs && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Breadcrumbs (last event)
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <BreadcrumbList breadcrumbs={latestEvent.breadcrumbs as BreadcrumbEntry[]} />
          </div>
        </section>
      )}

      {/* Recent events */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Recent occurrences ({events.length})
        </h2>
        <div className="space-y-2">
          {events.map((ev) => {
            const evBrowser = ev.browser as BrowserInfo | null;
            return (
              <div
                key={ev.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm"
              >
                <div className="space-y-0.5">
                  <div className="font-mono text-xs text-gray-500">{ev.id}</div>
                  {ev.url && (
                    <div className="text-gray-400 truncate max-w-xs">{ev.url}</div>
                  )}
                  {ev.userId && (
                    <div className="text-gray-500 text-xs">user: {ev.userId}</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-gray-400 whitespace-nowrap">{fmtDate(ev.createdAt)}</div>
                  {evBrowser && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {evBrowser.name} · {evBrowser.os}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
