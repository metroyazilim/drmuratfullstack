import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { dashedCard, helpText } from './ui';

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className={dashedCard}>
      {Icon ? <Icon className="mx-auto size-8 text-text-muted" aria-hidden="true" /> : null}
      <p className={Icon ? 'mt-3 text-sm font-bold text-text-primary' : 'text-sm font-bold text-text-primary'}>
        {title}
      </p>
      {description ? <p className={`mt-1 ${helpText}`}>{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
