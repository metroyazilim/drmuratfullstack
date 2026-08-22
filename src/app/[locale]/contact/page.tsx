import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { ExternalLink, Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { ContactForm } from '@/components/shared/contact-form';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getClinic, getListing } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string }> };

/** Klinikte kullanılan üç e-posta adresi (canlı siteden doğrulandı). */
const EXTRA_EMAILS = ['arge@drmuratirmak.com', 'satis@drmuratirmak.com'];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const listing = getListing('contact', locale as Locale);

  return buildMetadata({
    locale: locale as Locale,
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/contact'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function ContactPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const t = await getTranslations('nav');
  const tMap = await getTranslations('map');
  const listing = getListing('contact', typedLocale);
  const clinic = getClinic();

  const homeUrls = localeUrls('/');
  const pageUrls = localeUrls('/contact');
  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('contact'), url: pageUrls[typedLocale] },
  ];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    clinic.address.formatted,
  )}`;

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
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="bg-bg-inverse rounded-lg p-8 lg:p-10">
              <SectionLabel>{listing.info.eyebrow}</SectionLabel>
              <h2 className="text-text-inverse mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                {listing.info.title}
              </h2>

              <ul className="mt-8 space-y-5">
                <li className="border-border-inverse border-b pb-5">
                  <div className="text-text-inverse/50 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    ADR
                  </div>
                  <address className="text-text-inverse mt-1.5 text-sm not-italic leading-relaxed">
                    {clinic.address.formatted}
                  </address>
                </li>

                <li className="border-border-inverse border-b pb-5">
                  <div className="text-text-inverse/50 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    TEL
                  </div>
                  <a
                    href={`tel:${clinic.contact.phone}`}
                    className="text-text-inverse hover:text-accent-primary mt-1.5 block text-sm transition-colors"
                  >
                    <bdi>{clinic.contact.phoneFormatted}</bdi>
                  </a>
                </li>

                <li>
                  <div className="text-text-inverse/50 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase">
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    MAIL
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {[clinic.contact.email, ...EXTRA_EMAILS].map((email) => (
                      <li key={email}>
                        <a
                          href={`mailto:${email}`}
                          className="text-text-inverse hover:text-accent-primary text-sm transition-colors"
                        >
                          {email}
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </div>

            <div className="bg-bg-tint rounded-lg p-8 lg:p-10">
              <SectionLabel>{listing.form.eyebrow}</SectionLabel>
              <h2 className="text-text-primary mt-3 mb-6 text-2xl font-bold tracking-tight md:text-3xl">
                {listing.form.title}
              </h2>
              <ContactForm locale={locale} submitLabel={listing.form.submitLabel} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Harita facade'ı: gömülü iframe üçüncü parti çerez düşürür ve
          LCP'yi bozar. Statik görsel + dışa açılan yol tarifi bağlantısı. */}
      <Section variant="surface">
        <Container>
          <div className="relative h-96 overflow-hidden rounded-xl md:h-[28rem]">
            <Image
              src={listing.map.image}
              alt={listing.map.label}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
            <div className="bg-bg-base absolute bottom-6 start-6 max-w-xs rounded-lg p-4 shadow-lg">
              <p className="text-text-primary text-sm font-semibold">
                {listing.map.label}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-hover mt-2 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
              >
                {tMap('directions')}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
