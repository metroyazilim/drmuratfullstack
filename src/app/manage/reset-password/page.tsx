'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useActionState } from 'react';
import { AuthLayout } from '@/components/admin/AuthLayout';
import { PasswordInput } from '@/components/admin/PasswordInput';
import { Toast } from '@/components/admin/Toast';
import { fieldLabel, primaryButton } from '@/components/admin/ui';
import {
  applyPasswordResetAction,
  type PasswordResetActionState,
} from '../password-reset-actions';

const initialState: PasswordResetActionState = { ok: false, error: '' };

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [state, formAction, pending] = useActionState(
    applyPasswordResetAction,
    initialState,
  );

  return (
    <>
      {token ? (
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label htmlFor="password" className={fieldLabel}>
              Yeni parola
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label htmlFor="passwordConfirm" className={fieldLabel}>
              Yeni parola tekrarı
            </label>
            <PasswordInput
              id="passwordConfirm"
              name="passwordConfirm"
              autoComplete="new-password"
              required
            />
          </div>

          {state.ok && state.message ? <Toast message={state.message} /> : null}
          {!state.ok && state.error ? <Toast message={state.error} tone="error" /> : null}

          <button
            type="submit"
            disabled={pending || state.ok}
            className={`${primaryButton} mt-2 w-full py-2.5`}
          >
            {pending ? 'Kaydediliyor…' : 'Parolayı güncelle'}
          </button>
        </form>
      ) : (
        <Toast
          message="Sıfırlama bağlantısı eksik veya geçersiz. Lütfen yeni bir bağlantı isteyin."
          tone="error"
        />
      )}

      <Link
        href="/manage/login"
        className="mt-6 block text-center text-sm font-semibold text-accent-primary hover:underline"
      >
        Giriş ekranına dön
      </Link>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Yeni parola belirleyin"
      description="Yeni parolanız en az 12 karakter olmalıdır."
    >
      <Suspense fallback={<p className="text-sm text-text-muted">Yükleniyor…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
