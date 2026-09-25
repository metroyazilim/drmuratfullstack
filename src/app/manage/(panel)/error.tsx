'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cardPadded, primaryButton, secondaryButton } from '@/components/admin/ui';

export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[manage] Panel sayfası yüklenemedi:', error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className={cardPadded}>
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-state-error/10 text-state-error">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-state-error">
              Panel hatası
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-text-primary">
              Bir sorun oluştu
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              İstenen yönetim ekranı yüklenemedi. Tekrar deneyin veya gösterge paneline
              dönün.
            </p>
            {error.digest ? (
              <p className="mt-3 text-xs text-text-muted">
                Hata başvurusu:{' '}
                <code className="font-mono text-text-primary">{error.digest}</code>
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" className={primaryButton} onClick={reset}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Tekrar dene
              </button>
              <Link href="/manage" className={secondaryButton}>
                Gösterge paneline dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
