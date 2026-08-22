import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { getFaq, getHome, listPosts, listServices } from '@/lib/content';
import type { Locale } from '@/lib/i18n';
import { JsonLd } from '@/components/shared/json-ld';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { websiteSchema } from '@/lib/seo/schema';
import { Hero } from '@/components/sections/hero';
import { AboutSummary } from '@/components/sections/about-summary';
import { ServicesGrid } from '@/components/sections/services-grid';
import { WhyUs } from '@/components/sections/why-us';
import { ProcessSteps } from '@/components/sections/process-steps';
import { FaqSection } from '@/components/sections/faq-section';
import { LatestPosts } from '@/components/sections/latest-posts';
import { CtaBand } from '@/components/shared/cta-band';

type PageProps = {
  params: Promise<{ locale: string }>;
};

/** Tasarımda 6 hizmet kartı ve 4 blog kartı var. */
const FEATURED_SERVICES = 6;
const LATEST_POSTS = 4;
const HOME_FAQ_ITEMS = 3;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const home = getHome(locale as Locale);

  return buildMetadata({
    locale: locale as Locale,
    title: home.seo.title,
    description: home.seo.description,
    urls: localeUrls('/'),
    ogImage: home.seo.ogImage,
    ogImageAlt: home.hero.imageAlt,
    isHome: true,
  });
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const home = getHome(typedLocale);
  const services = listServices(typedLocale).slice(0, FEATURED_SERVICES);
  const { items: posts } = listPosts(typedLocale, { limit: LATEST_POSTS });
  const faq = getFaq(typedLocale).slice(0, HOME_FAQ_ITEMS);
  const urls = localeUrls('/');

  return (
    <>
      <JsonLd data={websiteSchema(typedLocale, urls[typedLocale])} />

      <Hero hero={home.hero} />
      <AboutSummary about={home.about} />
      <ServicesGrid copy={home.services} services={services} />
      <WhyUs whyUs={home.whyUs} />
      <ProcessSteps process={home.process} />
      <FaqSection copy={home.faq} items={faq} />
      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
      <LatestPosts copy={home.blog} posts={posts} />
    </>
  );
}
