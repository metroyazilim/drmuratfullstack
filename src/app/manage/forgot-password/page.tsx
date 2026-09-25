'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { AuthLayout } from '@/components/admin/AuthLayout';
import { Toast } from '@/components/admin/Toast';
import { fieldInput, fieldLabel, primaryButton } from '@/components/admin/ui';
import {
  requestPasswordResetAction,
  type PasswordResetActionState,
} from '../password-reset-actions';

const initialState: PasswordResetActionState = { ok: false, error: '' };

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );

  return (
    <AuthLayout
      title="Parolanızı mı unuttunuz?"
      description="E-posta adresinizi girin; hesabınız kayıtlıysa size bir sıfırlama bağlantısı gönderelim."
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

        {state.ok && state.message ? <Toast message={state.message} /> : null}
        {!state.ok && state.error ? <Toast message={state.error} tone="error" /> : null}

        <button
          type="submit"
          disabled={pending}
          className={`${primaryButton} mt-2 w-full py-2.5`}
        >
          {pending ? 'Gönderiliyor…' : 'Sıfırlama bağlantısı gönder'}
        </button>
        <Link
          href="/manage/login"
          className="text-center text-sm font-semibold text-accent-primary hover:underline"
        >
          Giriş ekranına dön
        </Link>
      </form>
    </AuthLayout>
  );
}
