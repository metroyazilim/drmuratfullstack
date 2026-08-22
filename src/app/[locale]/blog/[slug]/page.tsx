import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { PageBanner } from '@/components/shared/page-banner';
import { MedicalDisclaimer } from '@/components/shared/medical-disclaimer';
import { QuickAppointmentCard } from '@/components/shared/quick-appointment-card';
import { RecentPostsSidebar } from '@/components/shared/recent-posts-sidebar';
import { CtaBand } from '@/components/shared/cta-band';
import { JsonLd } from '@/components/shared/json-ld';
import { Link } from '@/lib/i18n';
import { buildMetadata } from '@/lib/seo/metadata';
import { localeUrls, localeUrlsFromSlugs } from '@/lib/seo/alternates';
import { breadcrumbSchema, postSchema } from '@/lib/seo/schema';
import {
  getAlternates,
  getHome,
  getPostBySlug,
  getServiceById,
  listPosts,
  listSlugs,
} from '@/lib/content';
import { routing, type Locale } from '@/lib/i18n';

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

const SIDEBAR_POSTS = 6;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    listSlugs('blog', locale).map((slug) => ({ locale, slug })),
  );
}

function resolveUrls(id: string) {
  const slugs = getAlternates('blog', id);
  return slugs
    ? localeUrlsFromSlugs('/blog/[slug]', slugs)
    : localeUrls('/blog');
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = locale as Locale;
  const post = await getPostBySlug(typedLocale, decodeURIComponent(slug));

  if (!post) return {};

  return buildMetadata({
    locale: typedLocale,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    urls: resolveUrls(post.id),
    ogImage: post.frontmatter.ogImage,
    ogImageAlt: post.frontmatter.heroImageAlt,
    type: 'article',
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    noindex: post.frontmatter.noindex,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const typedLocale = locale as Locale;
  const post = await getPostBySlug(typedLocale, decodeURIComponent(slug));

  if (!post) notFound();

  const t = await getTranslations('nav');
  const tBlog = await getTranslations('blog');
  const format = await getFormatter({ locale });

  const home = getHome(typedLocale);
  const urls = resolveUrls(post.id);
  const { items: recent } = listPosts(typedLocale, { limit: SIDEBAR_POSTS });

  const homeUrls = localeUrls('/');
  const blogUrls = localeUrls('/blog');

  const crumbs = [
    { name: t('home'), url: homeUrls[typedLocale], href: '/' as const },
    { name: t('blog'), url: blogUrls[typedLocale], href: '/blog' as const },
    { name: post.title, url: urls[typedLocale] },
  ];

  // İlgili hizmetler id ile çözülür; anchor metni hizmet başlığıdır.
  const relatedServices = (
    await Promise.all(
      post.frontmatter.relatedServices.map((id) =>
        getServiceById(typedLocale, id),
      ),
    )
  ).filter((service) => service !== null);

  const publishedLabel = format.dateTime(new Date(post.publishedAt), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <JsonLd
        data={[postSchema(post, typedLocale, urls[typedLocale]), breadcrumbSchema(crumbs)]}
      />

      <PageBanner
        title={post.title}
        image={post.frontmatter.heroImage}
        imageAlt={post.frontmatter.heroImageAlt}
        crumbs={crumbs}
      />

      <Section variant="base">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[2fr_1fr] lg:gap-14">
            <article className="min-w-0">
              <div className="relative h-64 overflow-hidden rounded-lg md:h-96">
                <Image
                  src={post.heroImage}
                  alt={post.heroImageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>

              {/* Tarih tasarımda yok; sağlık içeriğinde tazelik sinyali
                  gizlenmemeli ve BlogPosting zaten yayınlıyor. */}
              <div className="text-text-muted mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-[0.08em] uppercase">
                <span className="text-accent-primary">{tBlog('cardLabel')}</span>
                <span aria-hidden="true">•</span>
                <span>{post.category}</span>
                <span aria-hidden="true">•</span>
                <time dateTime={post.publishedAt} className="normal-case">
                  {publishedLabel}
                </time>
              </div>

              <p className="text-text-muted mt-4 text-base leading-relaxed">
                {post.description}
              </p>

              {/* MDX gövdesi h2 ile başlar; h1 banner'dadır. */}
              <div className="mt-6">{post.content}</div>

              <MedicalDisclaimer />

              {relatedServices.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-text-primary text-xl font-bold tracking-tight">
                    {tBlog('relatedServices')}
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {relatedServices.map((service) => (
                      <li key={service.id}>
                        <Link
                          href={{
                            pathname: '/services/[slug]',
                            params: { slug: service.slug },
                          }}
                          className="text-accent-primary hover:text-accent-hover text-sm font-semibold transition-colors"
                        >
                          {service.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <RecentPostsSidebar posts={recent} activeId={post.id} />
              <QuickAppointmentCard />
            </aside>
          </div>
        </Container>
      </Section>

      <CtaBand image={home.cta.image} imageAlt={home.cta.imageAlt} />
    </>
  );
}
