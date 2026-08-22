import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { PostCard } from '@/components/shared/post-card';
import { Reveal } from '@/components/shared/reveal';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getHome, getListing, listPosts } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const listing = getListing('blog', locale as Locale);

  return buildMetadata({
    locale: locale as Locale,
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/blog'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const t = await getTranslations('nav');
  const listing = getListing('blog', typedLocale);
  const home = getHome(typedLocale);

  // Sayfalama yok: 10 yazı tek akışta (SPEC-008 kararı, eşik 24 yazı).
  const { items: posts } = listPosts(typedLocale);

  const homeUrls = localeUrls('/');
  const blogUrls = localeUrls('/blog');

  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('blog'), url: blogUrls[typedLocale] },
  ];

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageBanner
        title={listing.banner.title}
        image={listing.banner.image}
        imageAlt={listing.banner.imageAlt}
        crumbs={crumbs}
      />

      <Section variant="base">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <SectionLabel>{listing.intro.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {listing.intro.title}
            </h2>
            <p className="text-text-muted mt-4 text-sm leading-relaxed md:text-base">
              {listing.intro.description}
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {posts.map((post, index) => (
              <Reveal key={post.id} direction="up" delay={(index % 2) * 90}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
