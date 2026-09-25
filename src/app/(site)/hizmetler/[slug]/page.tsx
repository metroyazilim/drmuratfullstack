import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { ServiceKpis } from '@/components/shared/service-facts';
import { ServiceBlocks } from '@/components/shared/service-blocks';
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
  listSlugs,
} from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** Tüm hizmet slug'ları → hepsi build'de statik üretilir. */
export async function generateStaticParams() {
  const slugs = await listSlugs('services', LOCALE);
  return slugs.map((slug) => ({ slug }));
}

async function resolveUrls(id: string) {
  const slugs = await getAlternates('services', id);
  return slugs
    ? localeUrlsFromSlugs('/services/[slug]', slugs)
    : localeUrls('/services');
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getServiceBySlug(LOCALE, decodeURIComponent(slug));

  if (!service) return {};

  return buildMetadata({
    title: service.frontmatter.title,
    description: service.frontmatter.description,
    urls: await resolveUrls(service.id),
    ogImage: service.frontmatter.ogImage,
    ogImageAlt: service.frontmatter.heroImageAlt,
    noindex: service.frontmatter.noindex,
  });
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const [service, t, tService, services, home] = await Promise.all([
    getServiceBySlug(LOCALE, decodeURIComponent(slug)),
    getTranslations('nav'),
    getTranslations('service'),
    listServices(LOCALE),
    getHome(LOCALE),
  ]);

  if (!service) notFound();

  const [urls, relatedRows] = await Promise.all([
    resolveUrls(service.id),
    Promise.all(
      service.frontmatter.relatedPosts.map((id) => getPostById(LOCALE, id)),
    ),
  ]);

  const homeUrls = localeUrls('/');
  const servicesUrls = localeUrls('/services');

  const crumbs = [
    { name: t('home'), url: homeUrls.tr, href: '/' as const },
    {
      name: t('services'),
      url: servicesUrls.tr,
      href: '/services' as const,
    },
    { name: service.title, url: urls.tr },
  ];

  // İlgili yazılar: id ile çözülür (slug dile göre değişir).
  const related = relatedRows.filter((post) => post !== null);

  return (
    <>
      <JsonLd
        data={[
          ...serviceSchema(service, urls.tr),
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
              <p className="text-text-muted mt-4 max-w-2xl text-base leading-relaxed">
                {service.shortDescription}
              </p>
              <ServiceKpis kpis={service.frontmatter.kpis} />
              <ServiceBlocks blocks={service.frontmatter.blocks} />

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
