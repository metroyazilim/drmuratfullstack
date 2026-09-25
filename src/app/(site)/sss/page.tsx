import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations } from '@/lib/strings';
import { LOCALE } from '@/lib/site-routes';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { FaqList } from '@/components/shared/faq-list';
import { CtaBand } from '@/components/shared/cta-band';
import { RichText } from '@/components/RichText';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema';
import { getFaq, getHome, getListing } from '@/lib/content';

export async function generateMetadata(): Promise<Metadata> {
  const listing = await getListing('faq', LOCALE);

  return buildMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/faq'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function FaqPage() {
  const [t, listing, items, home] = await Promise.all([
    getTranslations('nav'),
    getListing('faq', LOCALE),
    getFaq(LOCALE),
    getHome(LOCALE),
  ]);

  const homeUrls = localeUrls('/');
  const faqUrls = localeUrls('/faq');
  const crumbs = [
    { name: t('home'), url: homeUrls.tr, href: '/' as const },
    { name: t('faq'), url: faqUrls.tr },
  ];

  return (
    <>
      {/* Bu sayfa FAQPage şemasının TEK sahibidir; anasayfa üretmez. */}
      <JsonLd data={[faqSchema(items, faqUrls.tr), breadcrumbSchema(crumbs)]} />

      <PageBanner
        title={listing.banner.title}
        image={listing.banner.image}
        imageAlt={listing.banner.imageAlt}
        crumbs={crumbs}
      />

      <Section variant="base">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <SectionLabel>{listing.intro.eyebrow}</SectionLabel>
              <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
                {listing.intro.title}
              </h2>
              <RichText
                html={listing.intro.description}
                className="text-text-muted mt-4 text-sm leading-relaxed"
              />

              <div className="relative mt-8 h-96 overflow-hidden rounded-xl">
                <Image
                  src={listing.intro.image}
                  alt={listing.intro.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </div>

            <FaqList items={items} />
          </div>
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
