import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CorporatePage } from '@/components/sections/corporate-page';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { getHome, getPage } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

const PAGE_KEY = 'vision' as const;
const ROUTE = '/vision' as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPage(locale as Locale, PAGE_KEY);

  if (!page) return {};

  return buildMetadata({
    locale: locale as Locale,
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    urls: localeUrls(ROUTE),
    ogImage: page.frontmatter.ogImage,
    ogImageAlt: page.frontmatter.heroImageAlt,
    noindex: page.frontmatter.noindex,
  });
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const page = await getPage(typedLocale, PAGE_KEY);

  if (!page) notFound();

  const t = await getTranslations('nav');
  const home = getHome(typedLocale);
  const homeUrls = localeUrls('/');
  const pageUrls = localeUrls(ROUTE);

  return (
    <CorporatePage
      page={page}
      crumbs={[
        { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
        { name: page.title, url: pageUrls[typedLocale] },
      ]}
      ctaImage={home.cta.image}
      ctaImageAlt={home.cta.imageAlt}
    />
  );
}
