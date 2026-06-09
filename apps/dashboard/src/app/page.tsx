import { redirect } from 'next/navigation';
import { serverApi } from '@/lib/server-api';
import Link from 'next/link';

export default async function HomePage() {
  const api = await serverApi();
  let projects;
  try {
    projects = await api.projects.list();
  } catch {
    return (
      <div className="p-8 text-center text-gray-400">
        <p className="text-xl">Could not connect to the API.</p>
        <p className="mt-2 text-sm">Make sure the API is running on {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}.</p>
      </div>
    );
  }

  if (projects.length === 1) redirect(`/projects/${projects[0].id}`);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">Projects</h1>

      {projects.length === 0 ? (
        <div className="text-gray-400">
          No projects yet.{' '}
          <Link href="/projects/new" className="text-red-400 hover:underline">
            Create one
          </Link>
          .
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="block rounded-lg border border-gray-700 bg-gray-800 px-5 py-4 hover:border-red-500 transition-colors"
              >
                <div className="font-semibold text-gray-100">{p.name}</div>
                <div className="mt-1 font-mono text-xs text-gray-500">
                  API key: {p.apiKey}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + New project
        </Link>
      </div>
    </div>
  );
}
