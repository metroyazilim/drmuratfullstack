import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Mail, MapPin, Phone } from 'lucide-react';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { AppointmentForm } from '@/components/shared/appointment-form';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getClinic, getListing, listServices } from '@/lib/content';
import type { Locale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const listing = getListing('appointment', locale as Locale);

  return buildMetadata({
    locale: locale as Locale,
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/appointment'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function AppointmentPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const t = await getTranslations('nav');
  const listing = getListing('appointment', typedLocale);
  const clinic = getClinic();
  const services = listServices(typedLocale);

  const homeUrls = localeUrls('/');
  const pageUrls = localeUrls('/appointment');
  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('appointment'), url: pageUrls[typedLocale] },
  ];

  const info = [
    { icon: Phone, label: 'TEL', value: clinic.contact.phoneFormatted, href: `tel:${clinic.contact.phone}` },
    { icon: Mail, label: 'MAIL', value: clinic.contact.email, href: `mailto:${clinic.contact.email}` },
    { icon: MapPin, label: 'ADR', value: clinic.address.formatted },
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
          <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="bg-bg-inverse rounded-lg p-8 lg:p-10">
              <SectionLabel>{listing.info.eyebrow}</SectionLabel>
              <h2 className="text-text-inverse mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                {listing.info.title}
              </h2>
              <p className="text-text-inverse/60 mt-4 text-sm leading-relaxed">
                {listing.info.description}
              </p>

              <ul className="mt-8 space-y-5">
                {info.map((item) => (
                  <li key={item.label} className="border-border-inverse border-b pb-5 last:border-b-0">
                    <div className="text-text-inverse/50 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] uppercase">
                      <item.icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {item.label}
                    </div>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="text-text-inverse hover:text-accent-primary mt-1.5 block text-sm transition-colors"
                      >
                        <bdi>{item.value}</bdi>
                      </a>
                    ) : (
                      <address className="text-text-inverse mt-1.5 text-sm not-italic leading-relaxed">
                        {item.value}
                      </address>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-bg-tint rounded-lg p-8 lg:p-10">
              <SectionLabel>{listing.form.eyebrow}</SectionLabel>
              <h2 className="text-text-primary mt-3 mb-6 text-2xl font-bold tracking-tight md:text-3xl">
                {listing.form.title}
              </h2>
              <AppointmentForm
                locale={locale}
                services={services}
                submitLabel={listing.form.submitLabel}
              />
            </div>
          </div>
        </Container>
      </Section>

      <Section variant="surface">
        <Container>
          <div className="text-center">
            <SectionLabel>{listing.process.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {listing.process.title}
            </h2>
          </div>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listing.process.steps.map((step, index) => (
              <li key={step.title} className="border-border-default bg-bg-base rounded-lg border p-6 text-center">
                <span
                  className="bg-accent-soft text-accent-primary mx-auto flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold"
                  aria-hidden="true"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="text-text-primary mt-4 text-sm font-semibold">{step.title}</h3>
                <p className="text-text-muted mt-1.5 text-xs leading-relaxed">{step.description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
