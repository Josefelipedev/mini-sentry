import Link from 'next/link';

type Tab = 'errors' | 'performance' | 'releases' | 'settings';

interface Props {
  projectId: string;
  active: Tab;
}

const tabs: { key: Tab; label: string; href: (id: string) => string }[] = [
  { key: 'errors',      label: 'Errors',      href: (id) => `/projects/${id}` },
  { key: 'performance', label: 'Performance',  href: (id) => `/projects/${id}/performance` },
  { key: 'releases',    label: 'Releases',     href: (id) => `/projects/${id}/releases` },
  { key: 'settings',    label: 'Settings',     href: (id) => `/projects/${id}/settings` },
];

export function ProjectNav({ projectId, active }: Props) {
  return (
    <nav className="flex gap-1 border-b border-gray-700 mb-2">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href(projectId)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === tab.key
              ? 'border-red-500 text-red-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
