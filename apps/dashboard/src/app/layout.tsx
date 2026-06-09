import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import LogoutButton from '@/components/LogoutButton';

export const metadata: Metadata = {
  title: 'Mini Sentry',
  description: 'Front-end error monitoring dashboard',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const hasSession = store.has('ms_session');

  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 min-h-screen antialiased">
        <header className="border-b border-gray-700 px-6 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-red-400">🛡 Mini Sentry</span>
          {hasSession && <LogoutButton />}
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
