type Status = 'open' | 'resolved' | 'ignored';

const styles: Record<Status, string> = {
  open: 'bg-red-100 text-red-700',
  resolved: 'bg-green-100 text-green-700',
  ignored: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
