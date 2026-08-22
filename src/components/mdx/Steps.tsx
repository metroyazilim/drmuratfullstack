import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export function Steps({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('my-8 space-y-4 [counter-reset:step]', className)}>
      {children}
    </div>
  );
}

export function Step({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border-default bg-bg-surface relative rounded-lg border p-5 ps-14 [counter-increment:step]',
        className,
      )}
    >
      <span className="bg-accent-primary text-text-inverse absolute start-4 top-5 flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold before:content-[counter(step)]" />
      <h4 className="text-text-primary text-base font-semibold">{title}</h4>
      <div className="text-text-muted mt-2 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );
}
