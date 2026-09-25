import { cn } from './ui';

const STATUS_LABELS: Readonly<Record<string, string>> = {
  DRAFT: 'Taslak',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Arşivlendi',
  NEW: 'Yeni',
  READ: 'Okundu',
  ACTIVE: 'Etkin',
  INACTIVE: 'Devre dışı',
};

const STATUS_CLASSES: Readonly<Record<string, string>> = {
  DRAFT: 'bg-bg-surface text-text-muted',
  PUBLISHED: 'bg-state-success/10 text-state-success',
  ARCHIVED: 'bg-bg-surface text-text-muted',
  NEW: 'bg-accent-soft text-accent-primary',
  READ: 'bg-bg-surface text-text-muted',
  ACTIVE: 'bg-state-success/10 text-state-success',
  INACTIVE: 'bg-state-error/10 text-state-error',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
        STATUS_CLASSES[status] ?? 'bg-bg-surface text-text-muted',
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
