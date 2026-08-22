import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { FeatureCard } from '@/components/shared/feature-card';
import { PostCard } from '@/components/shared/post-card';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { ServiceSidebar } from '@/components/shared/service-sidebar';
import { QuickAppointmentCard } from '@/components/shared/quick-appointment-card';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrlsFromSlugs, localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema, serviceSchema } from '@/lib/seo/schema';
import {
  getAlternates,
  getHome,
  getPostById,
  getServiceBySlug,
  listServices,
} from '@/lib/content';
import { routing, type Locale } from '@/lib/i18n';
import { listSlugs } from '@/lib/content';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

/** Dört dil × tüm hizmet slug'ları → hepsi build'de statik üretilir. */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listSlugs('services', locale).map((slug) => ({ locale, slug })),
  );
}

/** Slug dile göre değiştiği için hreflang karşılıkları id üzerinden çözülür. */
async function resolveUrls(id: string) {
  const slugs = getAlternates('services', id);
  return slugs
    ? localeUrlsFromSlugs('/services/[slug]', slugs)
    : localeUrls('/services');
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = locale as Locale;
  const service = await getServiceBySlug(typedLocale, decodeURIComponent(slug));

  if (!service) return {};

  return buildMetadata({
    locale: typedLocale,
    title: service.frontmatter.title,
    description: service.frontmatter.description,
    urls: await resolveUrls(service.id),
    ogImage: service.frontmatter.ogImage,
    ogImageAlt: service.frontmatter.heroImageAlt,
    noindex: service.frontmatter.noindex,
  });
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const service = await getServiceBySlug(typedLocale, decodeURIComponent(slug));

  if (!service) notFound();

  const t = await getTranslations('nav');
  const tService = await getTranslations('service');
  const services = listServices(typedLocale);
  const home = getHome(typedLocale);
  const urls = await resolveUrls(service.id);

  const homeUrls = localeUrls('/');
  const servicesUrls = localeUrls('/services');

  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    {
      name: t('services'),
      url: servicesUrls[typedLocale],
      href: '/services' as const,
    },
    { name: service.title, url: urls[typedLocale] },
  ];

  // İlgili yazılar: id ile çözülür (slug dile göre değişir).
  const related = (
    await Promise.all(
      service.frontmatter.relatedPosts.map((id) =>
        getPostById(typedLocale, id),
      ),
    )
  ).filter((post) => post !== null);

  return (
    <>
      <JsonLd
        data={[
          ...serviceSchema(service, urls[typedLocale]),
          breadcrumbSchema(crumbs),
        ]}
      />

      <PageBanner
        title={service.title}
        image={service.frontmatter.heroImage}
        imageAlt={service.frontmatter.heroImageAlt}
        crumbs={crumbs}
      />

      <Section variant="base">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-14">
            <div className="min-w-0">
              <SectionLabel>{tService('detailEyebrow')}</SectionLabel>

              {/* MDX gövdesi h2 ile başlar; h1 banner'dadır. */}
              <div className="mt-4">{service.content}</div>

              {service.frontmatter.features.length > 0 && (
                <div className="mt-10 grid gap-5 sm:grid-cols-2">
                  {service.frontmatter.features.map((feature) => (
                    <FeatureCard
                      key={feature.title}
                      title={feature.title}
                      description={feature.description}
                    />
                  ))}
                </div>
              )}

              <MedicalDisclaimer />

              {/* Boşsa bölüm hiç render edilmez — başlık boşta kalmasın. */}
              {related.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-text-primary text-xl font-bold tracking-tight">
                    {tService('relatedPosts')}
                  </h2>
                  <div className="mt-5 grid gap-5">
                    {related.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <ServiceSidebar services={services} activeId={service.id} />
              <QuickAppointmentCard />
            </aside>
          </div>
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
