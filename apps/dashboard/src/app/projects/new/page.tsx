'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [origins, setOrigins] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');
    try {
      const allowedOrigins = origins
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const project = await api.projects.create({ name: name.trim(), allowedOrigins });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(String(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="text-2xl font-bold mb-6">New project</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Project name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. checkout-web"
            required
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-red-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Allowed origins{' '}
            <span className="text-gray-500 font-normal">(one per line, optional)</span>
          </label>
          <textarea
            value={origins}
            onChange={(e) => setOrigins(e.target.value)}
            rows={3}
            placeholder="https://app.yourcompany.com"
            className="w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 placeholder-gray-500 font-mono text-sm focus:border-red-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-red-600 px-4 py-2 font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating…' : 'Create project'}
        </button>
      </form>
    </div>
  );
}
