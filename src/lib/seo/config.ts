
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

export const SITE_NAME = 'Dr. Murat Irmak Kliniği';
export const OG_LOCALE = 'tr_TR';

export const DEFAULT_OG_IMAGE = '/images/og/default.webp';

/**
 * Göreli yolu mutlak, percent-encode edilmiş URL'e çevirir.
 *
 * Route'lar zaten canonical Türkçe yollar olduğu için yalnızca tek sefer
 * percent-encode edilir; tekrar encode edilmesi engellenir.
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
