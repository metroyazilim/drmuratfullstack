import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CorporatePage } from '@/components/sections/corporate-page';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls, localeUrlsFromSlugs } from '@/lib/seo/alternates';
import { getAlternates, getHome, getLegal, listSlugs } from '@/lib/content';
import { routing, type Locale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listSlugs('legal', locale).map((slug) => ({ locale, slug })),
  );
}

function resolveUrls(id: string) {
  const slugs = getAlternates('legal', id);
  return slugs ? localeUrlsFromSlugs('/legal/[slug]', slugs) : localeUrls('/');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = await getLegal(locale as Locale, decodeURIComponent(slug));
  if (!page) return {};

  return buildMetadata({
    locale: locale as Locale,
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    urls: resolveUrls(page.id),
    ogImage: page.frontmatter.ogImage,
    ogImageAlt: page.frontmatter.heroImageAlt,
    noindex: page.frontmatter.noindex,
  });
}

export default async function LegalPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const page = await getLegal(typedLocale, decodeURIComponent(slug));
  if (!page) notFound();

  const t = await getTranslations('nav');
  const home = getHome(typedLocale);
  const homeUrls = localeUrls('/');
  const urls = resolveUrls(page.id);

  return (
    <CorporatePage
      page={page}
      crumbs={[
        { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
        { name: page.title, url: urls[typedLocale] },
      ]}
      ctaImage={home.cta.image}
      ctaImageAlt={home.cta.imageAlt}
      variant="legal"
    />
  );
}
