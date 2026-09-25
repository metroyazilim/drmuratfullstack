import { ContentType } from '@prisma/client';
import { z } from 'zod';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import {
  CONTENT_TYPE_ORDER,
  CONTENT_TYPES,
  mergeFrontmatter,
} from '@/lib/admin/content-model';
import { ADMIN_LOCALES, type Locale } from '@/lib/admin/locales';
import { homeSchema, listingSchemas, type ListingKey } from '@/lib/content/schemas';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { SITE_URL } from '@/lib/seo/config';
import { SeoWorkspace, type SeoLocaleView, type SeoWorkspaceEntry } from './SeoWorkspace';

const querySchema = z.object({ item: z.string().optional() });

const staticDataSchema = z.object({
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string(),
  }),
  hero: z.object({ imageAlt: z.string() }).optional(),
  banner: z.object({ imageAlt: z.string() }).optional(),
});

type StaticPage = Readonly<{
  key: 'home' | ListingKey;
  label: string;
  path: Readonly<Record<Locale, string>>;
  editHref: string;
}>;

const STATIC_PAGES: readonly StaticPage[] = [
  {
    key: 'home',
    label: 'Anasayfa',
    path: { tr: '/' },
    editHref: '/manage/sayfa-metinleri/anasayfa',
  },
  {
    key: 'services',
    label: 'Hizmetler listesi',
    path: { tr: '/hizmetler' },
    editHref: '/manage/sayfa-metinleri/liste/services',
  },
  {
    key: 'blog',
    label: 'Blog listesi',
    path: { tr: '/blog' },
    editHref: '/manage/sayfa-metinleri/liste/blog',
  },
  {
    key: 'team',
    label: 'Ekip',
    path: { tr: '/ekibimiz' },
    editHref: '/manage/sayfa-metinleri/liste/team',
  },
  {
    key: 'gallery',
    label: 'Galeri',
    path: { tr: '/galeri' },
    editHref: '/manage/sayfa-metinleri/liste/gallery',
  },
  {
    key: 'faq',
    label: 'Sık sorulan sorular',
    path: { tr: '/sss' },
    editHref: '/manage/sayfa-metinleri/liste/faq',
  },
  {
    key: 'appointment',
    label: 'Randevu',
    path: { tr: '/randevu-al' },
    editHref: '/manage/sayfa-metinleri/liste/appointment',
  },
  {
    key: 'contact',
    label: 'İletişim',
    path: { tr: '/iletisim' },
    editHref: '/manage/sayfa-metinleri/liste/contact',
  },
];

const CONTENT_SEGMENTS: Readonly<Record<Exclude<ContentType, 'PAGE'>, Record<Locale, string>>> = {
  SERVICE: { tr: 'hizmetler' },
  POST: { tr: 'blog' },
  TEAM: { tr: 'ekibimiz' },
  LEGAL: { tr: 'yasal' },
};

function staticSchema(key: StaticPage['key']) {
  return key === 'home' ? homeSchema : listingSchemas[key];
}

function contentPath(type: ContentType, locale: Locale, slug: string): string {
  if (type === ContentType.PAGE) return `/${slug}`;
  return `/${CONTENT_SEGMENTS[type][locale]}/${slug}`;
}

function emptyLocale(locale: Locale, path: string, slug: string, complete: boolean): SeoLocaleView {
  return {
    localeId: null,
    locale,
    path,
    slug,
    title: '',
    description: '',
    primaryKeyword: '',
    secondaryKeywords: [],
    ogImage: '',
    heroImageAlt: '',
    noindex: false,
    allLocalesComplete: complete,
  };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function SeoPage({ searchParams }: { searchParams: SearchParams }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const rawQuery = await searchParams;
  const parsedQuery = querySchema.safeParse(rawQuery);
  const initialItem = parsedQuery.success ? (parsedQuery.data.item ?? null) : null;
  const [homeRows, listingRows, contentRows] = await Promise.all([
    prisma.homeContent.findMany({ orderBy: { locale: 'asc' } }),
    prisma.listingContent.findMany({ orderBy: [{ key: 'asc' }, { locale: 'asc' }] }),
    prisma.contentEntry.findMany({
      orderBy: [{ type: 'asc' }, { order: 'asc' }, { key: 'asc' }],
      include: { locales: true },
    }),
  ]);

  const staticEntries: SeoWorkspaceEntry[] = STATIC_PAGES.map((page) => {
    const rows = page.key === 'home' ? homeRows : listingRows.filter((row) => row.key === page.key);
    const schema = staticSchema(page.key);
    const complete = ADMIN_LOCALES.every((locale) => {
      const row = rows.find((item) => item.locale === locale);
      return Boolean(row && schema.safeParse(row.data).success);
    });
    const locales = ADMIN_LOCALES.map((locale): SeoLocaleView => {
      const row = rows.find((item) => item.locale === locale);
      if (!row) return emptyLocale(locale, page.path[locale], page.key, complete);
      const parsed = staticDataSchema.safeParse(row.data);
      if (!parsed.success) return emptyLocale(locale, page.path[locale], page.key, complete);
      return {
        localeId: null,
        locale,
        path: page.path[locale],
        slug: page.key,
        title: parsed.data.seo.title,
        description: parsed.data.seo.description,
        primaryKeyword: '',
        secondaryKeywords: [],
        ogImage: parsed.data.seo.ogImage,
        heroImageAlt:
          parsed.data.hero?.imageAlt ?? parsed.data.banner?.imageAlt ?? '',
        noindex: false,
        allLocalesComplete: complete,
      };
    });
    return {
      key: `static:${page.key}`,
      label: page.label,
      group: 'Sabit sayfalar',
      editHref: page.editHref,
      editable: false,
      locales,
    };
  });

  const contentEntries: SeoWorkspaceEntry[] = contentRows
    .sort((left, right) => CONTENT_TYPE_ORDER.indexOf(left.type) - CONTENT_TYPE_ORDER.indexOf(right.type))
    .map((entry) => {
      const meta = CONTENT_TYPES[entry.type];
      const complete = ADMIN_LOCALES.every((locale) => {
        const row = entry.locales.find((item) => item.locale === locale);
        return Boolean(row && meta.schema.safeParse(mergeFrontmatter(row)).success);
      });
      const locales = ADMIN_LOCALES.map((locale): SeoLocaleView => {
        const row = entry.locales.find((item) => item.locale === locale);
        if (!row) return emptyLocale(locale, `/${locale}`, entry.key, complete);
        return {
          localeId: row.id,
          locale,
          path: contentPath(entry.type, locale, row.slug),
          slug: row.slug,
          title: row.title,
          description: row.description,
          primaryKeyword: row.primaryKeyword,
          secondaryKeywords: row.secondaryKeywords,
          ogImage: row.ogImage,
          heroImageAlt: row.heroImageAlt,
          noindex: row.noindex,
          allLocalesComplete: complete,
        };
      });
      const label = entry.locales.find((item) => item.locale === 'tr')?.title || entry.key;
      return {
        key: `content:${entry.id}`,
        label,
        group: meta.label,
        editHref: `/manage/icerik/${meta.segment}/${entry.id}`,
        editable: true,
        locales,
      };
    });

  return (
    <div className={pageShell}>
      <PageHeader
        title="SEO çalışma alanı"
        description="Dört dilde arama görünümünü, sosyal kartları ve hreflang tamamlanmışlığını denetleyin."
      />
      <SeoWorkspace
        initialEntries={[...staticEntries, ...contentEntries]}
        initialItem={initialItem}
        siteUrl={SITE_URL}
      />
    </div>
  );
}
