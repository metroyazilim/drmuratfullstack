import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { Button } from '@/components/ui/button';
import { PageBanner } from '@/components/shared/page-banner';
import { Monogram } from '@/components/shared/monogram';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { Link } from '@/lib/i18n';
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
import { routing, type Locale } from '@/lib/i18n';

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listSlugs('team', locale).map((slug) => ({ locale, slug })),
  );
}

function resolveUrls(id: string) {
  const slugs = getAlternates('team', id);
  return slugs ? localeUrlsFromSlugs('/team/[slug]', slugs) : localeUrls('/team');
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const member = await getTeamMemberBySlug(locale as Locale, decodeURIComponent(slug));
  if (!member) return {};

  return buildMetadata({
    locale: locale as Locale,
    title: member.frontmatter.title,
    description: member.frontmatter.description,
    urls: resolveUrls(member.id),
    ogImage: member.frontmatter.ogImage,
    ogImageAlt: member.frontmatter.heroImageAlt,
    noindex: member.frontmatter.noindex,
  });
}

export default async function TeamMemberPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const member = await getTeamMemberBySlug(typedLocale, decodeURIComponent(slug));
  if (!member) notFound();

  const t = await getTranslations('nav');
  const tTeam = await getTranslations('team');
  const clinic = getClinic();
  const home = getHome(typedLocale);
  const urls = resolveUrls(member.id);

  const homeUrls = localeUrls('/');
  const teamUrls = localeUrls('/team');
  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('team'), url: teamUrls[typedLocale], href: '/team' as const },
    { name: member.frontmatter.name, url: urls[typedLocale] },
  ];

  const { photo, photoAlt, name, role, duties } = member.frontmatter;

  return (
    <>
      <JsonLd
        data={[personSchema(member, typedLocale, urls[typedLocale]), breadcrumbSchema(crumbs)]}
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
                      <p className="text-text-muted mt-1 text-xs leading-relaxed">
                        {duty.description}
                      </p>
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
