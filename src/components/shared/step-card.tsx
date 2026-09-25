import type { ReactNode } from 'react';

type StepCardProps = {
  index: number;
  title: string;
  description: ReactNode;
};

/** Numara index'ten üretilir; içerikte tekrar yazılmaz. */
export function StepCard({ index, title, description }: StepCardProps) {
  return (
    <div className="border-border-default bg-bg-base rounded-lg border p-6">
      <span
        className="text-accent-primary text-sm font-bold tracking-[0.08em]"
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <h3 className="text-text-primary mt-4 text-base font-semibold">{title}</h3>
      <div className="text-text-muted mt-2 text-sm leading-relaxed">
        {description}
      </div>
    </div>
  );
}
