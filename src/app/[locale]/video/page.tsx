import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { VideoGrid } from '@/components/shared/video-grid';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getVideos, getHome, getListing } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const listing = getListing('video', locale as Locale);

  return buildMetadata({
    locale: locale as Locale,
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/video'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function VideoPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const t = await getTranslations('nav');
  const listing = getListing('video', typedLocale);
  const items = getVideos(typedLocale);
  const home = getHome(typedLocale);

  const homeUrls = localeUrls('/');
  const videoUrls = localeUrls('/video');
  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('video'), url: videoUrls[typedLocale] },
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

          <VideoGrid videos={items} />
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
