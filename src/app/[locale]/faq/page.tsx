import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { FaqList } from '@/components/shared/faq-list';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema';
import { getFaq, getHome, getListing } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const listing = getListing('faq', locale as Locale);

  return buildMetadata({
    locale: locale as Locale,
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/faq'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function FaqPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const t = await getTranslations('nav');
  const listing = getListing('faq', typedLocale);
  const items = getFaq(typedLocale);
  const home = getHome(typedLocale);

  const homeUrls = localeUrls('/');
  const faqUrls = localeUrls('/faq');
  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('faq'), url: faqUrls[typedLocale] },
  ];

  return (
    <>
      {/* Bu sayfa FAQPage şemasının TEK sahibidir; anasayfa üretmez. */}
      <JsonLd data={[faqSchema(items, faqUrls[typedLocale]), breadcrumbSchema(crumbs)]} />

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
              <p className="text-text-muted mt-4 text-sm leading-relaxed">
                {listing.intro.description}
              </p>

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
