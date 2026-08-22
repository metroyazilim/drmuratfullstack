import type { Locale } from '@/lib/i18n';

/**
 * Canonical origin. Preview dağıtımlarında Vercel'in verdiği URL kullanılır,
 * aksi halde canonical'lar yanlış domaini işaret eder ve preview içeriği
 * canlı siteyi kannibalize eder.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const vercel = process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;

  return 'https://www.drmuratirmak.com';
}

export const SITE_URL = resolveSiteUrl();

export const IS_PRODUCTION_DEPLOY =
  process.env.VERCEL_ENV === 'production' ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production');

export const SITE_NAME: Record<Locale, string> = {
  tr: 'Dr. Murat Irmak Kliniği',
  en: 'Dr. Murat Irmak Clinic',
  ar: 'عيادة الدكتور مراد إرماك',
  ru: 'Клиника доктора Мурата Ирмака',
};

export const OG_LOCALE: Record<Locale, string> = {
  tr: 'tr_TR',
  en: 'en_US',
  ar: 'ar_AR',
  ru: 'ru_RU',
};

/** hreflang x-default → tr (birincil pazar Türkiye, dil seçim sayfası yok). */
export const X_DEFAULT_LOCALE: Locale = 'tr';

export const DEFAULT_OG_IMAGE = '/images/og/default.webp';

/**
 * Göreli yolu mutlak, percent-encode edilmiş URL'e çevirir.
 *
 * next-intl'in getPathname'i Arapça yolları zaten kodlar; körlemesine
 * encodeURI çağırmak "%D8" → "%25D8" çift kodlamasına yol açar. Önce
 * çözüp sonra kodlamak işlemi idempotent yapar.
 */
export function absoluteUrl(pathname: string): string {
  return `${SITE_URL}${encodeUriOnce(pathname)}`;
}

function encodeUriOnce(value: string): string {
  let decoded = value;
  try {
    decoded = decodeURI(value);
  } catch {
    // Geçersiz kaçış dizisi: değer ham kabul edilir.
  }
  return encodeURI(decoded);
}
