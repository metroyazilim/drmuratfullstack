import type { Metadata } from 'next';
import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PageBanner } from '@/components/shared/page-banner';
import { TeamCard } from '@/components/shared/team-card';
import { Reveal } from '@/components/shared/reveal';
import { FeatureCard } from '@/components/shared/feature-card';
import { CtaBand } from '@/components/shared/cta-band';
import { RichText } from '@/components/RichText';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { breadcrumbSchema } from '@/lib/seo/schema';
import { getHome, getListing, listTeam } from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';

export async function generateMetadata(): Promise<Metadata> {
  const listing = await getListing('team', LOCALE);

  return buildMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    urls: localeUrls('/team'),
    ogImage: listing.seo.ogImage,
    ogImageAlt: listing.banner.imageAlt,
  });
}

export default async function TeamPage() {
  const [t, listing, members, home] = await Promise.all([
    getTranslations('nav'),
    getListing('team', LOCALE),
    listTeam(LOCALE),
    getHome(LOCALE),
  ]);

  const homeUrls = localeUrls('/');
  const teamUrls = localeUrls('/team');
  const crumbs = [
    { name: t('home'), url: homeUrls.tr, href: '/' as const },
    { name: t('team'), url: teamUrls.tr },
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
            <RichText
              html={listing.intro.description}
              className="text-text-muted mt-4 text-sm leading-relaxed md:text-base"
            />
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {members.map((member, index) => (
              <Reveal key={member.id} direction="up" delay={(index % 3) * 90}>
                <TeamCard member={member} />
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      <Section variant="surface">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {listing.approach.items.map((item) => (
              <FeatureCard
                key={item.title}
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
