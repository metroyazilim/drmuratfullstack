import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const sectionVariants = cva('py-16 md:py-24', {
  variants: {
    variant: {
      base: 'bg-bg-base text-text-primary',
      surface: 'bg-bg-surface text-text-primary',
      tint: 'bg-bg-tint text-text-primary',
      inverse: 'bg-bg-inverse text-text-inverse',
    },
  },
  defaultVariants: {
    variant: 'base',
  },
});

type SectionProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof sectionVariants>;

export function Section({
  className,
  variant,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(sectionVariants({ variant, className }))} {...props}>
      {children}
    </section>
  );
}
