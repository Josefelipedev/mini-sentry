'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ErrorGroupDTO } from '@mini-sentry/shared';
import { StatusBadge } from './StatusBadge';
import { api } from '@/lib/api';

interface Props {
  projectId: string;
  groups: ErrorGroupDTO[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function ErrorTable({ projectId, groups }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [updating, setUpdating] = useState<string | null>(null);

  const changeStatus = async (
    groupId: string,
    status: 'open' | 'resolved' | 'ignored'
  ) => {
    setUpdating(groupId);
    await api.errors.updateStatus(projectId, groupId, status);
    setUpdating(null);
    startTransition(() => router.refresh());
  };

  if (groups.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        No errors found. Great job! 🎉
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800 text-left text-gray-400">
            <th className="px-4 py-3 font-medium">Error</th>
            <th className="px-4 py-3 font-medium text-right">Occurrences</th>
            <th className="px-4 py-3 font-medium text-right">Users</th>
            <th className="px-4 py-3 font-medium">Environment</th>
            <th className="px-4 py-3 font-medium">Last seen</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <tr
              key={g.id}
              className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
            >
              <td className="px-4 py-3 max-w-sm">
                <Link
                  href={`/projects/${projectId}/errors/${g.id}`}
                  className="font-mono text-red-400 hover:underline line-clamp-2"
                >
                  {g.title}
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono text-gray-300">
                {g.totalOccurrences.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-300">
                {g.affectedUsers.length}
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-xs bg-gray-700 px-2 py-0.5 rounded">
                  {g.environment}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                {fmtDate(g.lastSeenAt)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={g.status} />
              </td>
              <td className="px-4 py-3">
                <select
                  disabled={updating === g.id || pending}
                  value={g.status}
                  onChange={(e) =>
                    changeStatus(
                      g.id,
                      e.target.value as 'open' | 'resolved' | 'ignored'
                    )
                  }
                  className="text-xs bg-gray-700 text-gray-200 rounded px-2 py-1 border border-gray-600 disabled:opacity-50"
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                  <option value="ignored">Ignored</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
