'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { AuthLayout } from '@/components/admin/AuthLayout';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { Toast } from '@/components/admin/Toast';
import { fieldInput, fieldLabel, primaryButton } from '@/components/admin/ui';
import { loginAction, type LoginActionState } from '../actions';

const initialState: LoginActionState = { ok: false, error: '' };

export default function ManageLoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <AuthLayout
      title="Yönetim paneline giriş"
      description="Site içeriğini ve klinik taleplerini yönetmek için hesabınızla giriş yapın."
    >
      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className={fieldLabel}>
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={fieldInput}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="password" className={fieldLabel}>
              Parola
            </label>
            <Link
              href="/manage/forgot-password"
              className="text-xs font-semibold text-accent-primary hover:underline"
            >
              Parolamı unuttum
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </div>

        {!state.ok && state.error ? <Toast message={state.error} tone="error" /> : null}

        <button
          type="submit"
          disabled={pending}
          className={`${primaryButton} mt-2 w-full py-2.5`}
        >
          {pending ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </AuthLayout>
  );
}
