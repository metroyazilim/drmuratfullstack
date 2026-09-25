import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { card, cn } from './ui';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: LucideIcon;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
        {Icon ? (
          <span className="flex size-9 items-center justify-center rounded-md bg-accent-soft text-accent-primary">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </>
  );
  const className = cn(card, 'block p-5');

  return href ? (
    <Link href={href} className={cn(className, 'transition-colors hover:border-accent-primary')}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
