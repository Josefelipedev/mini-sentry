import type { BreadcrumbEntry } from '@mini-sentry/shared';

const typeIcon: Record<BreadcrumbEntry['type'], string> = {
  navigation: '🗺',
  click: '🖱',
  http: '🌐',
  console: '💬',
  manual: '📌',
};

export function BreadcrumbList({ breadcrumbs }: { breadcrumbs: BreadcrumbEntry[] }) {
  if (!breadcrumbs.length) {
    return <p className="text-sm text-gray-400">No breadcrumbs recorded.</p>;
  }

  return (
    <ol className="space-y-1">
      {breadcrumbs.map((b, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 text-base">{typeIcon[b.type]}</span>
          <div className="min-w-0 flex-1">
            <span className="font-mono text-xs text-gray-500 mr-2">
              {new Date(b.timestamp).toISOString().slice(11, 23)}
            </span>
            <span className="text-gray-300">{b.message}</span>
            {b.data && (
              <pre className="mt-0.5 text-xs text-gray-500 truncate">
                {JSON.stringify(b.data)}
              </pre>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
