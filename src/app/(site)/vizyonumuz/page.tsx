import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from '@/lib/strings';
import { CorporatePage } from '@/components/sections/corporate-page';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { getHome, getPage } from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';

const PAGE_KEY = 'vision' as const;
const ROUTE = '/vision' as const;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(LOCALE, PAGE_KEY);

  if (!page) return {};

  return buildMetadata({
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    urls: localeUrls(ROUTE),
    ogImage: page.frontmatter.ogImage,
    ogImageAlt: page.frontmatter.heroImageAlt,
    noindex: page.frontmatter.noindex,
  });
}

export default async function Page() {
  const [page, t, home] = await Promise.all([
    getPage(LOCALE, PAGE_KEY),
    getTranslations('nav'),
    getHome(LOCALE),
  ]);

  if (!page) notFound();
  const homeUrls = localeUrls('/');
  const pageUrls = localeUrls(ROUTE);

  return (
    <CorporatePage
      page={page}
      crumbs={[
        { name: t('home'), url: homeUrls.tr, href: '/' as const },
        { name: page.title, url: pageUrls.tr },
      ]}
      ctaImage={home.cta.image}
      ctaImageAlt={home.cta.imageAlt}
    />
  );
}
