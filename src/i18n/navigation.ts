import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

export function localizedHref(
  locale: (typeof routing.locales)[number],
  href: Parameters<typeof getPathname>[0]['href'],
): string {
  return getPathname({ locale, href });
}
