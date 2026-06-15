import { cn } from '@/lib/utils';

const styles = {
  completed: 'bg-green-light text-green-normal',
  active: 'bg-green-light text-green-normal',
  pending: 'bg-amber-50 text-amber-700',
  invited: 'bg-blue-light text-blue-normal',
  failed: 'bg-red-50 text-red-normal',
  suspended: 'bg-red-50 text-red-normal',
  inactive: 'bg-gray-normal text-gray',
  credit: 'bg-green-light text-green-normal',
  debit: 'bg-red-50 text-red-normal',
} as const;

export function StatusBadge({
  status,
  label,
}: {
  status: keyof typeof styles;
  label?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        styles[status] ?? 'bg-gray-normal text-gray'
      )}
    >
      {label ?? status}
    </span>
  );
}
