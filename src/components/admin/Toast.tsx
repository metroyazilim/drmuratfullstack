import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from './ui';

export function Toast({
  message,
  tone = 'success',
}: {
  message: string;
  tone?: 'success' | 'error';
}) {
  const success = tone === 'success';
  const Icon = success ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role={success ? 'status' : 'alert'}
      className={cn(
        'flex items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm',
        success
          ? 'border-state-success/30 bg-state-success/5 text-state-success'
          : 'border-state-error/30 bg-state-error/5 text-state-error',
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
