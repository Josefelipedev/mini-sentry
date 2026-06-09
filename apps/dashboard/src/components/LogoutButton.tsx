'use client';

import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch(`${API}/api/v1/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
    >
      Sign out
    </button>
  );
}
