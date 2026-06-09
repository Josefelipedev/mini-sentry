import { notFound } from 'next/navigation';
import Link from 'next/link';
import { serverApi } from '@/lib/server-api';
import { ErrorTable } from '@/components/ErrorTable';
import { ProjectNav } from '@/components/ProjectNav';

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ status?: string; environment?: string; page?: string }>;
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const { status, environment, page } = await searchParams;
  const api = await serverApi();

  let projects;
  let result;

  try {
    [projects, result] = await Promise.all([
      api.projects.list(),
      api.errors.list(projectId, {
        status,
        environment,
        page: page ? Number(page) : 1,
      }),
    ]);
  } catch {
    notFound();
  }

  const project = projects.find((p) => p.id === projectId);
  if (!project) notFound();

  const { data: groups, total, limit } = result;
  const currentPage = page ? Number(page) : 1;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/" className="hover:text-gray-300">Projects</Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="mt-1 text-xs font-mono text-gray-500">
            API Key: <span className="text-gray-400">{project.apiKey}</span>
          </p>
        </div>
        <Link href="/projects/new" className="text-sm text-gray-400 hover:text-gray-200">
          + New project
        </Link>
      </div>

      <ProjectNav projectId={projectId} active="errors" />

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 mb-6">
        <select
          name="status"
          defaultValue={status ?? ''}
          className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-200"
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>

        <input
          name="environment"
          defaultValue={environment ?? ''}
          placeholder="Environment…"
          className="rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 w-40"
        />

        <button
          type="submit"
          className="rounded bg-gray-700 px-3 py-1.5 text-sm hover:bg-gray-600 transition-colors"
        >
          Filter
        </button>

        {(status || environment) && (
          <Link
            href={`/projects/${projectId}`}
            className="rounded bg-gray-700 px-3 py-1.5 text-sm hover:bg-gray-600 transition-colors text-gray-400"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Total */}
      <p className="text-sm text-gray-500 mb-4">
        {total.toLocaleString()} issue{total !== 1 ? 's' : ''}
      </p>

      <ErrorTable projectId={projectId} groups={groups} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3 mt-6">
          {currentPage > 1 && (
            <Link
              href={`/projects/${projectId}?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(environment ? { environment } : {}),
                page: String(currentPage - 1),
              })}`}
              className="rounded bg-gray-700 px-3 py-1.5 text-sm hover:bg-gray-600"
            >
              ← Prev
            </Link>
          )}
          <span className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/projects/${projectId}?${new URLSearchParams({
                ...(status ? { status } : {}),
                ...(environment ? { environment } : {}),
                page: String(currentPage + 1),
              })}`}
              className="rounded bg-gray-700 px-3 py-1.5 text-sm hover:bg-gray-600"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
