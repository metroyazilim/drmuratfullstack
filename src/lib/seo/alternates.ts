import type { Metadata } from 'next';
import { ROUTE_PATHS, type Locale } from '@/lib/site-routes';
import { absoluteUrl } from './config';

type StaticHref = keyof typeof ROUTE_PATHS;

type DetailPathname = '/services/[slug]' | '/blog/[slug]' | '/team/[slug]' | '/legal/[slug]';

const DETAIL_BASES: Record<DetailPathname, string> = {
  '/services/[slug]': '/hizmetler',
  '/blog/[slug]': '/blog',
  '/team/[slug]': '/ekibimiz',
  '/legal/[slug]': '/yasal',
};

export function localeUrls(href: StaticHref): Record<Locale, string> {
  return { tr: absoluteUrl(ROUTE_PATHS[href]) };
}

export function localeUrlsFromSlugs(
  pathname: DetailPathname,
  slugs: Record<Locale, string>,
): Record<Locale, string> {
  return { tr: absoluteUrl(`${DETAIL_BASES[pathname]}/${slugs.tr}`) };
}

export function buildAlternates(urls: Record<Locale, string>): Metadata['alternates'] {
  return { canonical: urls.tr };
}
