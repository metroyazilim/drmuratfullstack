// eslint-disable-next-line no-restricted-imports
import NextLink from 'next/link';
import type { ComponentProps } from 'react';

export { redirect, usePathname, useRouter } from 'next/navigation';

export type Locale = 'tr';
export const LOCALE: Locale = 'tr';

/**
 * Canonical site route map for the single Turkish public site.
 * Public components use this wrapper so canonical route keys stay separate
 * from admin URLs and internal content identifiers.
 */

export const ROUTE_PATHS = {
  '/': '/',
  '/about': '/hakkimizda',
  '/mission': '/misyonumuz',
  '/vision': '/vizyonumuz',
  '/quality': '/kalite-politikamiz',
  '/team': '/ekibimiz',
  '/services': '/hizmetler',
  '/blog': '/blog',
  '/gallery': '/galeri',
  '/faq': '/sss',
  '/appointment': '/randevu-al',
  '/contact': '/iletisim',
} as const;

export function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const resolved =
    typeof href === 'string' && href in ROUTE_PATHS
      ? ROUTE_PATHS[href as keyof typeof ROUTE_PATHS]
      : href;
  return <NextLink href={resolved} {...rest} />;
}
