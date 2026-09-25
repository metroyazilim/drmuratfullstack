import type { Metadata } from 'next';
import { getTranslations } from '@/lib/strings';
import { LOCALE } from '@/lib/site-routes';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { GalleryGrid } from '@/components/shared/gallery-grid';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { RichText } from '@/components/RichText';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema, imageObjectSchema } from '@/lib/seo/schema';
import { getGallery, getHome, getListing } from '@/lib/content';

export async function generateMetadata(): Promise<Metadata> {
  const listing = await getListing('gallery', LOCALE);

  return buildMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/gallery'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function GalleryPage() {
  const [t, listing, items, home] = await Promise.all([
    getTranslations('nav'),
    getListing('gallery', LOCALE),
    getGallery(LOCALE),
    getHome(LOCALE),
  ]);

  const homeUrls = localeUrls('/');
  const galleryUrls = localeUrls('/gallery');
  const crumbs = [
    { name: t('home'), url: homeUrls.tr, href: '/' as const },
    { name: t('gallery'), url: galleryUrls.tr },
  ];

  return (
    <>
      <JsonLd data={[breadcrumbSchema(crumbs), ...items.map(imageObjectSchema)]} />

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
            <RichText
              html={listing.intro.description}
              className="text-text-muted mt-4 text-sm leading-relaxed md:text-base"
            />
          </div>

          <GalleryGrid items={items} />
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
