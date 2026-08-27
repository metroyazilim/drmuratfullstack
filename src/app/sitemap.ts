import type { MetadataRoute } from 'next';
import { getAlternates, getPostBySlug, listEntityIds } from '@/lib/content';
import type { ContentType } from '@/lib/content/types';
import { routing, type Locale } from '@/lib/i18n';
import { localeUrls, localeUrlsFromSlugs } from '@/lib/seo/alternates';
import { X_DEFAULT_LOCALE } from '@/lib/seo/config';

type StaticRoute = Parameters<typeof localeUrls>[0];

/** Dile göre çevrilen statik yollar — next-intl pathnames ile aynı küme. */
const staticRoutes = [
  '/',
  '/about',
  '/mission',
  '/vision',
  '/quality',
  '/team',
  '/services',
  '/blog',
  '/gallery',
  '/faq',
  '/appointment',
  '/contact',
] as const satisfies readonly StaticRoute[];

const detailRoutes = [
  { type: 'services', pathname: '/services/[slug]' },
  { type: 'blog', pathname: '/blog/[slug]' },
  { type: 'team', pathname: '/team/[slug]' },
  { type: 'legal', pathname: '/legal/[slug]' },
] as const;

/**
 * Her dil kendi girişini alır ve alternates dört dili + x-default'u listeler.
 * priority / changeFrequency yazılmaz — Google bu alanları yok sayıyor.
 */
function entries(
  urls: Record<Locale, string>,
  lastModified?: string,
): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: urls[locale],
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    alternates: {
      languages: { ...urls, 'x-default': urls[X_DEFAULT_LOCALE] },
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [];

  for (const route of staticRoutes) {
    items.push(...entries(localeUrls(route)));
  }

  for (const { type, pathname } of detailRoutes) {
    for (const id of listEntityIds(type as ContentType)) {
      const slugs = getAlternates(type as ContentType, id);
      if (!slugs) continue;

      const lastModified =
        type === 'blog' ? await blogLastModified(slugs) : undefined;

      items.push(...entries(localeUrlsFromSlugs(pathname, slugs), lastModified));
    }
  }

  return items;
}

async function blogLastModified(
  slugs: Record<Locale, string>,
): Promise<string | undefined> {
  const slug = slugs[X_DEFAULT_LOCALE];
  if (!slug) return undefined;

  const post = await getPostBySlug(X_DEFAULT_LOCALE, slug);
  return post?.updatedAt ?? post?.publishedAt;
}
