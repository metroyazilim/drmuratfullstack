import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/page-banner';
import { Monogram } from '@/components/shared/monogram';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { RichText } from '@/components/RichText';
import { Link } from '@/lib/site-routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls, localeUrlsFromSlugs } from '@/lib/seo/alternates';
import { breadcrumbSchema, personSchema } from '@/lib/seo/schema';
import {
  getAlternates,
  getClinic,
  getHome,
  getTeamMemberBySlug,
  listSlugs,
} from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const slugs = await listSlugs('team', LOCALE);
  return slugs.map((slug) => ({ slug }));
}

async function resolveUrls(id: string) {
  const slugs = await getAlternates('team', id);
  return slugs ? localeUrlsFromSlugs('/team/[slug]', slugs) : localeUrls('/team');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(LOCALE, decodeURIComponent(slug));
  if (!member) return {};

  return buildMetadata({
    title: member.frontmatter.title,
    description: member.frontmatter.description,
    urls: await resolveUrls(member.id),
    ogImage: member.frontmatter.ogImage,
    ogImageAlt: member.frontmatter.heroImageAlt,
    noindex: member.frontmatter.noindex,
  });
}

export default async function TeamMemberPage({ params }: PageProps) {
  const { slug } = await params;

  const [member, t, tTeam, clinic, home] = await Promise.all([
    getTeamMemberBySlug(LOCALE, decodeURIComponent(slug)),
    getTranslations('nav'),
    getTranslations('team'),
    getClinic(),
    getHome(LOCALE),
  ]);
  if (!member) notFound();

  const urls = await resolveUrls(member.id);

  const homeUrls = localeUrls('/');
  const teamUrls = localeUrls('/team');
  const crumbs = [
    { name: t('home'), url: homeUrls.tr, href: '/' as const },
    { name: t('team'), url: teamUrls.tr, href: '/team' as const },
    { name: member.frontmatter.name, url: urls.tr },
  ];

  const { photo, photoAlt, name, role, duties } = member.frontmatter;

  return (
    <>
      <JsonLd
        data={[
          personSchema(member, LOCALE, urls.tr, clinic),
          breadcrumbSchema(crumbs),
        ]}
      />

      <PageBanner
        title={name}
        image={member.frontmatter.heroImage}
        imageAlt={member.frontmatter.heroImageAlt}
        crumbs={crumbs}
      />

      <Section variant="base">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="h-96 overflow-hidden rounded-xl lg:h-[32rem]">
              {photo ? (
                <div className="relative h-full w-full">
                  <Image
                    src={photo}
                    alt={photoAlt ?? name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <Monogram name={name} className="h-full w-full" />
              )}
            </div>

            <div>
              {/* Ad banner'daki h1'de; burada tekrarlanmaz (SPEC-008 kararı). */}
              <SectionLabel>{tTeam('eyebrow')}</SectionLabel>

              <ul className="mt-4 flex flex-wrap gap-2">
                <li className="bg-accent-soft text-accent-primary rounded-full px-3 py-1.5 text-xs font-semibold">
                  {role}
                </li>
                <li className="bg-accent-soft text-accent-primary rounded-full px-3 py-1.5 text-xs font-semibold">
                  {clinic.name}
                </li>
              </ul>

              <div className="mt-6">{member.content}</div>

              {duties && (
                <ul className="mt-8 grid gap-4 sm:grid-cols-3">
                  {duties.map((duty) => (
                    <li
                      key={duty.title}
                      className="border-border-default rounded-lg border p-4"
                    >
                      <p className="text-text-primary text-sm font-semibold">
                        {duty.title}
                      </p>
                      <RichText
                        html={duty.description}
                        className="text-text-muted mt-1 text-xs leading-relaxed"
                      />
                    </li>
                  ))}
                </ul>
              )}

              <Link href="/contact" className="mt-8 inline-block">
                <Button variant="primary">{tTeam('contactCta')}</Button>
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
