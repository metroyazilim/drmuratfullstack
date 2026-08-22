'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'dmi-cookie-notice';
const EVENT = 'dmi-cookie-notice-change';

/**
 * localStorage bir dış depo; React'in bunun için önerdiği API
 * useSyncExternalStore. Effect içinde setState çağırmak yerine bunu
 * kullanmak hem lint kuralına uyar hem hydration uyumsuzluğu üretmez:
 * sunucu anlık görüntüsü "görüldü" döner, band yalnızca hydration
 * sonrasında belirir.
 */
function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

type CookieNoticeProps = {
  /** Çerez politikası sayfasının bu dildeki slug'ı; yoksa band linksiz olur. */
  policySlug?: string;
};

/**
 * ONAY KAPISI DEĞİL, BİLGİLENDİRME BANDI.
 *
 * Site şu an yalnızca işlevsel çerez kullanıyor (next-intl dil tercihi).
 * İzleme çerezi yok. İşlevsel çerez için onay kapısı koymak gereksiz
 * sürtünme ve yanlış bir yasal sinyal olur.
 *
 * SPEC-012'de izleme eklenirse bu bileşen onay kapısına YÜKSELTİLMELİDİR.
 */
export function CookieNotice({ policySlug }: CookieNoticeProps) {
  const t = useTranslations('cookie');

  const seen = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY) === 'seen',
    () => true,
  );

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'seen');
    window.dispatchEvent(new Event(EVENT));
  }, []);

  if (seen) return null;

  return (
    <div
      role="region"
      aria-label={t('text')}
      className="border-border-default bg-bg-base fixed inset-x-0 bottom-0 z-40 border-t p-4 print:hidden"
    >
      <div className="mx-auto flex w-full max-w-(--spacing-container) flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-muted text-xs leading-relaxed">
          {t('text')}{' '}
          {policySlug && (
            <Link
              href={{ pathname: '/legal/[slug]', params: { slug: policySlug } }}
              className="text-accent-primary hover:text-accent-hover underline"
            >
              {t('link')}
            </Link>
          )}
        </p>

        <Button
          variant="primary"
          size="sm"
          onClick={dismiss}
        >
          {t('accept')}
        </Button>
      </div>
    </div>
  );
}
