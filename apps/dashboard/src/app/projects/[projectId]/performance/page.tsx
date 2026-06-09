import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import { ProjectNav } from '@/components/ProjectNav';
import type { PerfRating } from '@mini-sentry/shared';

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ days?: string }>;
}

const ratingStyle: Record<PerfRating, string> = {
  'good':              'bg-green-900/50 text-green-400 border-green-800',
  'needs-improvement': 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  'poor':              'bg-red-900/50 text-red-400 border-red-800',
};

const vitalDesc: Record<string, string> = {
  LCP:  'Largest Contentful Paint — main content load time',
  CLS:  'Cumulative Layout Shift — visual stability',
  INP:  'Interaction to Next Paint — responsiveness',
  TTFB: 'Time to First Byte — server response time',
  FCP:  'First Contentful Paint',
  FID:  'First Input Delay',
};

function fmtValue(name: string, value: number): string {
  if (name === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

export default async function PerformancePage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const { days } = await searchParams;
  const daysNum = Number(days ?? 7);
  const api = await serverApi();

  let summary;
  try {
    summary = await api.performance.summary(projectId, daysNum);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
      <ProjectNav projectId={projectId} active="performance" />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Performance</h1>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <a
              key={d}
              href={`?days=${d}`}
              className={`text-sm px-3 py-1 rounded border transition-colors ${
                daysNum === d
                  ? 'border-red-500 text-red-400 bg-red-900/20'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {/* Web Vitals */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Web Vitals
        </h2>
        {summary.webVitals.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No data yet. Set <code className="text-gray-400">enablePerformance: true</code> in
            your SDK config.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {summary.webVitals.map((v) => (
              <div
                key={v.name}
                className="rounded-lg border border-gray-700 bg-gray-800 p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gray-100">{v.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      ratingStyle[v.rating as PerfRating] ?? ratingStyle['poor']
                    }`}
                  >
                    {v.rating}
                  </span>
                </div>
                <div className="text-2xl font-mono text-gray-100">
                  {fmtValue(v.name, v.avg)}
                </div>
                <div className="text-xs text-gray-500">
                  {vitalDesc[v.name] ?? v.name} · {v.count} samples
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Slowest APIs */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Slowest API calls (avg)
        </h2>
        {summary.slowestApis.length === 0 ? (
          <p className="text-gray-500 text-sm">No slow requests recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Endpoint</th>
                  <th className="px-4 py-3 font-medium text-right">Avg</th>
                  <th className="px-4 py-3 font-medium text-right">P95</th>
                  <th className="px-4 py-3 font-medium text-right">Calls</th>
                </tr>
              </thead>
              <tbody>
                {summary.slowestApis.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-300 max-w-md truncate">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-yellow-400">
                      {row.avg}ms
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-orange-400">
                      {row.p95}ms
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* HTTP Errors */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Most frequent HTTP errors
        </h2>
        {summary.httpErrors.length === 0 ? (
          <p className="text-gray-500 text-sm">No HTTP errors recorded.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800 text-left text-gray-400">
                  <th className="px-4 py-3 font-medium">Endpoint</th>
                  <th className="px-4 py-3 font-medium text-right">Count</th>
                </tr>
              </thead>
              <tbody>
                {summary.httpErrors.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-300 max-w-lg truncate">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-400">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
