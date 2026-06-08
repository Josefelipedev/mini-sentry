'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProjectNav } from '@/components/ProjectNav';
import type { ProjectDTO } from '@mini-sentry/shared';

export default function SettingsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    api.projects.list().then((projects) => {
      const p = projects.find((x) => x.id === projectId) ?? null;
      setProject(p);
      if (p) {
        setWebhookUrl(p.alertWebhookUrl ?? '');
        setEmail(p.alertEmail ?? '');
      }
    });
  }, [projectId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus('saving');
    try {
      await api.projects.updateAlerts(projectId, {
        alertWebhookUrl: webhookUrl.trim() || null,
        alertEmail: email.trim() || null,
      });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch {
      setStatus('error');
    }
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 text-gray-500 text-sm">Loading…</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/" className="hover:text-gray-300">Projects</Link>
            <span>/</span>
            <span>{project.name}</span>
          </div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
      </div>

      <ProjectNav projectId={projectId} active="settings" />

      <div className="mt-8 max-w-lg">
        <h2 className="text-lg font-semibold mb-1">Alert settings</h2>
        <p className="text-sm text-gray-400 mb-6">
          Mini Sentry sends an alert when a <strong>new error group</strong> is detected for the first time.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Slack */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Slack Incoming Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/…"
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to disable Slack alerts.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Alert email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500">
              Requires <code className="text-gray-400">SMTP_HOST</code> env var on the API. Leave empty to disable email alerts.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving…' : 'Save'}
            </button>
            {status === 'saved' && (
              <span className="text-sm text-green-400">Saved.</span>
            )}
            {status === 'error' && (
              <span className="text-sm text-red-400">Failed to save. Try again.</span>
            )}
          </div>
        </form>

        {/* SMTP hint */}
        <div className="mt-10 rounded border border-gray-700 bg-gray-800/50 p-4 text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-300">Email env vars (API)</p>
          <p><code>SMTP_HOST</code> — e.g. <code>smtp.sendgrid.net</code></p>
          <p><code>SMTP_PORT</code> — default <code>587</code></p>
          <p><code>SMTP_SECURE</code> — <code>true</code> for port 465</p>
          <p><code>SMTP_USER</code> / <code>SMTP_PASS</code> — credentials</p>
          <p><code>SMTP_FROM</code> — sender address</p>
        </div>
      </div>
    </div>
  );
}
