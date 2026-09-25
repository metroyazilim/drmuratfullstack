import * as React from 'react';
import { cn } from '@/lib/utils/cn';

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: (props: {
    id: string;
    'aria-invalid': boolean | undefined;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
};

/**
 * Etiket + alan + hata üçlüsü.
 * Hata `aria-describedby` ile alana bağlanır ve role="alert" ile duyurulur
 * (code-standards.md → Erişilebilirlik).
 */
export function Field({ id, label, error, required, hint, children }: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined;

  return (
    <div>
      <label htmlFor={id} className="text-text-primary block text-sm font-medium">
        {label}
        {required && (
          <span className="text-state-error ms-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="mt-1.5">
        {children({
          id,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': describedBy,
        })}
      </div>

      {hint && (
        <p id={hintId} className="text-text-muted mt-1 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-state-error mt-1 text-[0.8125rem]">
          {error}
        </p>
      )}
    </div>
  );
}

const controlBase =
  'w-full rounded-md border bg-bg-base px-3 text-sm text-text-primary placeholder:text-text-muted/70 transition-colors focus-visible:outline-none focus-visible:border-accent-primary focus-visible:ring-1 focus-visible:ring-accent-primary disabled:opacity-50 aria-[invalid=true]:border-state-error';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlBase, 'h-11', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={5}
    className={cn(controlBase, 'py-2.5 leading-relaxed', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';

