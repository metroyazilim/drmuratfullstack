'use client';

import { useEffect } from 'react';
import { useTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';

/**
 * Hata detayı kullanıcıya GÖSTERİLMEZ, yalnızca loglanır
 * (code-standards.md → Server Actions: teknik detay sızdırılmaz).
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] Beklenmeyen hata:', error);
  }, [error]);

  const t = useTranslations('error');

  return (
    <Section variant="base">
      <Container>
        <div className="mx-auto max-w-xl py-16 text-center">
          <h1 className="text-text-primary text-2xl font-bold tracking-tight md:text-3xl">
            {t('genericTitle')}
          </h1>
          <p className="text-text-muted mt-3 text-sm leading-relaxed">
            {t('genericBody')}
          </p>
          <Button variant="primary" className="mt-8" onClick={reset}>
            {t('retry')}
          </Button>
        </div>
      </Container>
    </Section>
  );
}
