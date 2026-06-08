import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mini Sentry',
  description: 'Front-end error monitoring dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-gray-100 min-h-screen antialiased">
        <header className="border-b border-gray-700 px-6 py-3 flex items-center gap-3">
          <span className="text-lg font-bold text-red-400">🛡 Mini Sentry</span>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
