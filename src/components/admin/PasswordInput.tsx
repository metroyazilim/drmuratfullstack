'use client';

import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { fieldInput } from './ui';

export function PasswordInput({
  name,
  id,
  placeholder,
  autoComplete,
  required,
}: {
  name: string;
  id?: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  const generatedId = useId();
  const inputId = id ?? `${name}-${generatedId}`;
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={inputId}
        name={name}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={`${fieldInput} pe-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-controls={inputId}
        aria-pressed={visible}
        aria-label={visible ? 'Parolayı gizle' : 'Parolayı göster'}
        className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
