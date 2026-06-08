import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectNav } from '@/components/ProjectNav';
import { ReleasesTable } from '@/components/ReleasesTable';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ReleasesPage({ params }: Props) {
  const { projectId } = await params;

  let releases: { version: string; files: number }[];
  try {
    releases = await api.releases.list(projectId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <ProjectNav projectId={projectId} active="releases" />

      <div>
        <h1 className="text-xl font-bold mb-1">Source Map Releases</h1>
        <p className="text-sm text-gray-500">
          Source maps are uploaded via the CLI after each build.
        </p>
      </div>

      {releases.length === 0 ? (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
          <p className="text-gray-400 mb-3">No source maps uploaded yet.</p>
          <pre className="inline-block text-left text-xs bg-gray-900 rounded p-4 text-gray-300">
{`npx @mini-sentry/cli sourcemaps \\
  --api-url <API_URL> \\
  --api-key <YOUR_KEY> \\
  --version 1.0.0 \\
  --dir ./dist`}
          </pre>
        </div>
      ) : (
        <ReleasesTable projectId={projectId} releases={releases} />
      )}
    </div>
  );
}
