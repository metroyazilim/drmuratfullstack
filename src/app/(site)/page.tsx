import type { Metadata } from 'next';
import { getClinic, getFaq, getHome, listPosts, listServices } from '@/lib/content';
import { LOCALE } from '@/lib/site-routes';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls } from '@/lib/seo/alternates';
import { Hero } from '@/components/sections/hero';
import { AboutSummary } from '@/components/sections/about-summary';
import { ServicesGrid } from '@/components/sections/services-grid';
import { WhyUs } from '@/components/sections/why-us';
import { ProcessSteps } from '@/components/sections/process-steps';
import { FaqSection } from '@/components/sections/faq-section';
import { LatestPosts } from '@/components/sections/latest-posts';
import { CtaBand } from '@/components/shared/cta-band';

/** Tasarımda 6 hizmet kartı ve 4 blog kartı var. */
const FEATURED_SERVICES = 6;
const LATEST_POSTS = 4;
const HOME_FAQ_ITEMS = 3;

export async function generateMetadata(): Promise<Metadata> {
  const home = await getHome(LOCALE);

  return buildMetadata({
    title: home.seo.title,
    description: home.seo.description,
    urls: localeUrls('/'),
    ogImage: home.seo.ogImage,
    ogImageAlt: home.hero.imageAlt,
    isHome: true,
  });
}

export default async function HomePage() {
  const [home, servicesResult, postsResult, faqResult, clinic] = await Promise.all([
    getHome(LOCALE),
    listServices(LOCALE),
    listPosts(LOCALE, { limit: LATEST_POSTS }),
    getFaq(LOCALE),
    getClinic(),
  ]);
  const services = servicesResult.slice(0, FEATURED_SERVICES);
  const posts = postsResult.items;
  const faq = faqResult.slice(0, HOME_FAQ_ITEMS);

  return (
    <>
      {/* WebSite / MedicalClinic / Physician şemaları layout'ta basılır. */}
      <Hero hero={home.hero} instagram={clinic.social.instagram} />
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
