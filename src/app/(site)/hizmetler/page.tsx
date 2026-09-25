import type { Metadata } from 'next';
import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { ServiceCard } from '@/components/shared/service-card';
import { Reveal } from '@/components/shared/reveal';
import { ApproachSection } from '@/components/sections/approach-section';
import { CtaBand } from '@/components/shared/cta-band';
import { RichText } from '@/components/RichText';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getHome, getListing, listServices } from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';

export async function generateMetadata(): Promise<Metadata> {
  const listing = await getListing('services', LOCALE);

  return buildMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/services'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function ServicesPage() {
  const [t, listing, services, home] = await Promise.all([
    getTranslations('nav'),
    getListing('services', LOCALE),
    listServices(LOCALE),
    getHome(LOCALE),
  ]);

  const homeUrls = localeUrls('/');
  const servicesUrls = localeUrls('/services');

  const crumbs = [
    { name: t('home'), url: homeUrls.tr, href: '/' as const },
    { name: t('services'), url: servicesUrls.tr },
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
          <SectionLabel>{listing.intro.eyebrow}</SectionLabel>
          <h2 className="text-text-primary mt-3 max-w-3xl text-2xl font-bold tracking-tight md:text-4xl">
            {listing.intro.title}
          </h2>
          <RichText
            html={listing.intro.description}
            className="text-text-muted mt-4 max-w-2xl text-sm leading-relaxed md:text-base"
          />

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <Reveal key={service.id} direction="up" delay={(index % 3) * 90}>
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <ApproachSection approach={listing.approach} />

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
