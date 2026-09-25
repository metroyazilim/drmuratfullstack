import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from '@/lib/strings';
import { CorporatePage } from '@/components/sections/corporate-page';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls, localeUrlsFromSlugs } from '@/lib/seo/alternates';
import { getAlternates, getHome, getLegal, listSlugs } from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await listSlugs('legal', LOCALE);
  return slugs.map((slug) => ({ slug }));
}

async function resolveUrls(id: string) {
  const slugs = await getAlternates('legal', id);
  return slugs ? localeUrlsFromSlugs('/legal/[slug]', slugs) : localeUrls('/');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLegal(LOCALE, decodeURIComponent(slug));
  if (!page) return {};

  return buildMetadata({
    title: page.frontmatter.title,
    description: page.frontmatter.description,
    urls: await resolveUrls(page.id),
    ogImage: page.frontmatter.ogImage,
    ogImageAlt: page.frontmatter.heroImageAlt,
    noindex: page.frontmatter.noindex,
  });
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params;

  const [page, t, home] = await Promise.all([
    getLegal(LOCALE, decodeURIComponent(slug)),
    getTranslations('nav'),
    getHome(LOCALE),
  ]);
  if (!page) notFound();

  const urls = await resolveUrls(page.id);
  const homeUrls = localeUrls('/');

  return (
    <CorporatePage
      page={page}
      crumbs={[
        { name: t('home'), url: homeUrls.tr, href: '/' as const },
        { name: page.title, url: urls.tr },
      ]}
      ctaImage={home.cta.image}
      ctaImageAlt={home.cta.imageAlt}
      variant="legal"
    />
  );
}
