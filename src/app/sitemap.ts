import type { MetadataRoute } from 'next';
import { getAlternates, getPostBySlug, listEntityIds } from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';
import { localeUrls, localeUrlsFromSlugs } from '@/lib/seo/alternates';

type StaticRoute = Parameters<typeof localeUrls>[0];

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

/** Tek dil (tr): her yol tek bir sitemap girişi alır, alternates yok. */
function entries(
  urls: Record<'tr', string>,
  lastModified?: string,
): MetadataRoute.Sitemap {
  return [
    {
      url: urls.tr,
      ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items: MetadataRoute.Sitemap = [];

  for (const route of staticRoutes) {
    items.push(...entries(localeUrls(route)));
  }

  const detailItems = await Promise.all(
    detailRoutes.map(async ({ type, pathname }) => {
      const ids = await listEntityIds(type);
      return Promise.all(
        ids.map(async (id) => {
          const slugs = await getAlternates(type, id);
          const lastModified =
            type === 'blog' ? await blogLastModified(slugs) : undefined;
          return entries(localeUrlsFromSlugs(pathname, slugs), lastModified);
        }),
      );
    }),
  );
  items.push(...detailItems.flat(2));

  return items;
}

async function blogLastModified(
  slugs: Record<'tr', string>,
): Promise<string | undefined> {
  const slug = slugs.tr;
  if (!slug) return undefined;

  const post = await getPostBySlug(LOCALE, slug);
  return post?.updatedAt ?? post?.publishedAt;
}
