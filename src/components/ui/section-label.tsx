import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type SectionLabelProps = React.HTMLAttributes<HTMLParagraphElement>;

export function SectionLabel({
  className,
  children,
  ...props
}: SectionLabelProps) {
  return (
    <p
      className={cn(
        'text-accent-primary text-xs leading-relaxed font-semibold tracking-[0.08em] uppercase',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
