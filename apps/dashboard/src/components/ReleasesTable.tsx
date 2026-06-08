'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Props {
  projectId: string;
  releases: { version: string; files: number }[];
}

export function ReleasesTable({ projectId, releases }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, { id: string; filename: string; createdAt: string }[]>>({});

  const loadFiles = async (version: string) => {
    if (expanded === version) { setExpanded(null); return; }
    if (!files[version]) {
      const data = await api.releases.listFiles(projectId, version);
      setFiles((prev) => ({ ...prev, [version]: data }));
    }
    setExpanded(version);
  };

  const deleteVersion = async (version: string) => {
    if (!confirm(`Delete all source maps for version "${version}"?`)) return;
    setDeleting(version);
    await api.releases.deleteVersion(projectId, version);
    setDeleting(null);
    startTransition(() => router.refresh());
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800 text-left text-gray-400">
            <th className="px-4 py-3 font-medium">Version</th>
            <th className="px-4 py-3 font-medium text-right">Files</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((release) => (
            <>
              <tr
                key={release.version}
                className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-gray-200">{release.version}</td>
                <td className="px-4 py-3 text-right text-gray-400">{release.files}</td>
                <td className="px-4 py-3 flex items-center gap-3">
                  <button
                    onClick={() => loadFiles(release.version)}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    {expanded === release.version ? 'Hide files' : 'View files'}
                  </button>
                  <button
                    disabled={deleting === release.version || pending}
                    onClick={() => deleteVersion(release.version)}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    {deleting === release.version ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>

              {expanded === release.version && files[release.version] && (
                <tr key={`${release.version}-files`} className="bg-gray-900">
                  <td colSpan={3} className="px-6 py-3">
                    <ul className="space-y-1">
                      {files[release.version]!.map((f) => (
                        <li key={f.id} className="flex items-center justify-between text-xs">
                          <span className="font-mono text-gray-400">{f.filename}</span>
                          <span className="text-gray-600">
                            {new Date(f.createdAt).toLocaleString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
