import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type ContainerProps = React.HTMLAttributes<HTMLDivElement>;

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-(--spacing-container) px-4 md:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
