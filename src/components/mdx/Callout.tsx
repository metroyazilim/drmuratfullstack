import * as React from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface CalloutProps {
  variant?: 'info' | 'warning';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({
  variant = 'info',
  title,
  children,
  className,
}: CalloutProps) {
  const isWarning = variant === 'warning';

  return (
    <aside
      className={cn(
        'my-6 flex gap-3.5 rounded-lg border-s-4 p-4 text-sm leading-relaxed',
        isWarning
          ? 'border-state-error bg-state-error/5 text-text-primary'
          : 'border-accent-primary bg-bg-tint text-text-primary',
        className,
      )}
    >
      <div className="shrink-0 pt-0.5">
        {isWarning ? (
          <AlertTriangle className="text-state-error h-5 w-5" />
        ) : (
          <Info className="text-accent-primary h-5 w-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-text-primary mb-1 font-semibold">{title}</p>
        )}
        <div className="text-text-muted space-y-2">{children}</div>
      </div>
    </aside>
  );
}
