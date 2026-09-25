import Image from 'next/image';
import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { Button } from '@/components/ui/button';
import { FeatureCard } from '@/components/shared/feature-card';
import { Timeline } from '@/components/shared/timeline';
import { PageBanner } from '@/components/shared/page-banner';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { Link } from '@/lib/site-routes';
import { RichText } from '@/components/RichText';
import type { Crumb } from '@/components/shared/breadcrumbs';
import type { Page, Legal } from '@/lib/content/types';

type CorporatePageProps = {
  page: Page | Legal;
  crumbs: Crumb[];
  ctaImage: string;
  ctaImageAlt: string;
  /** Yasal sayfalarda randevu CTA'sı ve CTA bandı gösterilmez. */
  variant?: 'corporate' | 'legal';
};

/**
 * Dört kurumsal sayfa ve üç yasal sayfa aynı şablonu kullanır.
 * Opsiyonel bloklar (sidebarImage, approach, timeline) yalnızca
 * frontmatter'da varsa render edilir.
 */
export async function CorporatePage({
  page,
  crumbs,
  ctaImage,
  ctaImageAlt,
  variant = 'corporate',
}: CorporatePageProps) {
  const t = await getTranslations('page');
  const fm = page.frontmatter as Page['frontmatter'];
  const hasSidebar = Boolean(fm.sidebarImage);

  return (
    <>
      <JsonLd data={breadcrumbSchema(crumbs)} />

      <PageBanner
        title={page.title}
        image={fm.heroImage}
        imageAlt={fm.heroImageAlt}
        crumbs={crumbs}
      />

      <Section variant="base">
        <Container>
          <div
            className={
              hasSidebar
                ? 'grid items-start gap-10 lg:grid-cols-2 lg:gap-16'
                : 'max-w-3xl'
            }
          >
            <div>
              <div className="prose-content">{page.content}</div>

              {variant === 'corporate' && (
                <Link href="/appointment" className="mt-8 inline-block">
                  <Button variant="primary">
                    {fm.ctaLabel ?? t('appointmentCta')}
                  </Button>
                </Link>
              )}
            </div>

            {hasSidebar && fm.sidebarImage && (
              <div className="relative h-96 overflow-hidden rounded-xl lg:h-[32rem]">
                <Image
                  src={fm.sidebarImage}
                  alt={fm.sidebarImageAlt ?? page.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            )}
          </div>
        </Container>
      </Section>

      {fm.approach && (
        <Section variant="surface">
          <Container>
            <div className="text-center">
              <SectionLabel>{fm.approach.eyebrow}</SectionLabel>
              <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
                {fm.approach.title}
              </h2>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {fm.approach.items.map((item) => (
                <FeatureCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={<RichText html={item.description} />}
                />
              ))}
            </div>
          </Container>
        </Section>
      )}

      {fm.timeline && (
        <Section variant="base">
          <Container>
            <SectionLabel>{fm.timeline.eyebrow}</SectionLabel>
            <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
              {fm.timeline.title}
            </h2>
            <Timeline rows={fm.timeline.rows} />
          </Container>
        </Section>
      )}

      {variant === 'corporate' && (
        <CtaBand image={ctaImage} imageAlt={ctaImageAlt} />
      )}
    </>
  );
}
