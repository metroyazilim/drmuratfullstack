import type { Metadata } from 'next';
import { getPathname } from '@/i18n/navigation';
import { routing, type Locale } from '@/lib/i18n';
import { absoluteUrl, X_DEFAULT_LOCALE } from './config';

type Href = Parameters<typeof getPathname>[0]['href'];

/**
 * Bir route'un dört dildeki mutlak URL'i.
 * Karşılıklılık (A→B ise B→A) burada yapısal olarak garanti edilir;
 * hreflang setleri elle yazılmaz.
 */
export function localeUrls(href: Href): Record<Locale, string> {
  const entries = routing.locales.map((locale) => [
    locale,
    absoluteUrl(getPathname({ locale, href })),
  ]);

  return Object.fromEntries(entries) as Record<Locale, string>;
}

/**
 * Detay sayfaları için: slug dile göre değiştiğinden her locale kendi
 * slug'ıyla çözülür (SPEC-003 getAlternates çıktısı).
 */
export function localeUrlsFromSlugs(
  pathname: '/services/[slug]' | '/blog/[slug]' | '/team/[slug]' | '/legal/[slug]',
  slugs: Record<Locale, string>,
): Record<Locale, string> {
  const entries = routing.locales.map((locale) => [
    locale,
    absoluteUrl(
      getPathname({
        locale,
        // next-intl'in tipli href'i dinamik pathname'lerde params bekler
        href: { pathname, params: { slug: slugs[locale] } } as Href,
      }),
    ),
  ]);

  return Object.fromEntries(entries) as Record<Locale, string>;
}

export function buildAlternates(
  locale: Locale,
  urls: Record<Locale, string>,
  noindex = false,
): Metadata['alternates'] {
  const canonical = urls[locale];

  // noindex sayfalarda hreflang üretilmez.
  if (noindex) return { canonical };

  return {
    canonical,
    languages: {
      ...urls,
      'x-default': urls[X_DEFAULT_LOCALE],
    },
  };
}
