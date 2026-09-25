import { ContentType } from '@prisma/client';
import type { z } from 'zod';
import {
  legalFrontmatterSchema,
  pageFrontmatterSchema,
  postFrontmatterSchema,
  seoFrontmatterSchema,
  serviceFrontmatterSchema,
  teamFrontmatterSchema,
} from '@/lib/content/schemas';

/**
 * Panelin içerik sözleşmesi.
 *
 * Veritabanı satırı ile dosya frontmatter'ı arasındaki çeviri tek yerde
 * yapılır: her tipte ortak olan SEO alanları `ContentLocale` sütunlarına,
 * tipe özel alanlar (`kpis`, `blocks`, `duties`, `approach`, `publishedAt`…)
 * `data` JSON sütununa gider. Doğrulama, dosya tabanlı içeriği bugün
 * doğrulayan şemaların aynısıyla yapılır; panelden girilen içerik, build
 * kapılarından (`content:check`, `seo:check`) geçmek zorunda.
 */

export type ContentFrontmatterSchema =
  | typeof serviceFrontmatterSchema
  | typeof postFrontmatterSchema
  | typeof teamFrontmatterSchema
  | typeof pageFrontmatterSchema
  | typeof legalFrontmatterSchema;

export type ContentTypeMeta = Readonly<{
  type: ContentType;
  /** Panel adresindeki segment: `/manage/icerik/<segment>`. */
  segment: string;
  /** `content/` altındaki klasör adı — içe/dışa aktarma bunu kullanır. */
  contentDir: string;
  label: string;
  singular: string;
  schema: ContentFrontmatterSchema;
  /** Sıralanabilir mi (hizmetler ve ekip `order` taşır). */
  hasOrder: boolean;
  /** Yeni kayıt açılabilir mi — kurumsal sayfalar sabit dört anahtardır. */
  canCreate: boolean;
  /** Yayın adresi kalıbı; `[slug]` dile göre çözülür. */
  hrefPattern: string;
}>;

export const CONTENT_TYPES: Readonly<Record<ContentType, ContentTypeMeta>> = {
  SERVICE: {
    type: ContentType.SERVICE,
    segment: 'hizmetler',
    contentDir: 'services',
    label: 'Hizmetler',
    singular: 'Hizmet',
    schema: serviceFrontmatterSchema,
    hasOrder: true,
    canCreate: true,
    hrefPattern: '/services/[slug]',
  },
  POST: {
    type: ContentType.POST,
    segment: 'blog',
    contentDir: 'blog',
    label: 'Blog',
    singular: 'Blog yazısı',
    schema: postFrontmatterSchema,
    hasOrder: false,
    canCreate: true,
    hrefPattern: '/blog/[slug]',
  },
  TEAM: {
    type: ContentType.TEAM,
    segment: 'ekip',
    contentDir: 'team',
    label: 'Ekip',
    singular: 'Ekip üyesi',
    schema: teamFrontmatterSchema,
    hasOrder: true,
    canCreate: true,
    hrefPattern: '/team/[slug]',
  },
  PAGE: {
    type: ContentType.PAGE,
    segment: 'kurumsal',
    contentDir: 'pages',
    label: 'Kurumsal sayfalar',
    singular: 'Kurumsal sayfa',
    schema: pageFrontmatterSchema,
    hasOrder: false,
    canCreate: false,
    hrefPattern: '/[key]',
  },
  LEGAL: {
    type: ContentType.LEGAL,
    segment: 'yasal',
    contentDir: 'legal',
    label: 'Yasal metinler',
    singular: 'Yasal metin',
    schema: legalFrontmatterSchema,
    hasOrder: false,
    canCreate: true,
    hrefPattern: '/legal/[slug]',
  },
};

export const CONTENT_TYPE_ORDER: readonly ContentType[] = [
  ContentType.SERVICE,
  ContentType.POST,
  ContentType.TEAM,
  ContentType.PAGE,
  ContentType.LEGAL,
];

/** Kurumsal sayfaların sabit anahtarları — rota dosyaları bunlara bağlı. */
export const PAGE_KEYS: readonly string[] = ['about', 'mission', 'vision', 'quality'];

const SEGMENT_TO_TYPE: Readonly<Record<string, ContentType>> = {
  hizmetler: ContentType.SERVICE,
  blog: ContentType.POST,
  ekip: ContentType.TEAM,
  kurumsal: ContentType.PAGE,
  yasal: ContentType.LEGAL,
};

export function contentTypeFromSegment(segment: string): ContentType | null {
  return SEGMENT_TO_TYPE[segment] ?? null;
}

/** `ContentLocale` tablosunda kendi sütunu olan, her tipte ortak alanlar. */
const BASE_FIELDS: Readonly<Record<string, true>> = {
  slug: true,
  title: true,
  description: true,
  primaryKeyword: true,
  secondaryKeywords: true,
  ogImage: true,
  heroImage: true,
  heroImageAlt: true,
  noindex: true,
};

export type LocaleBaseColumns = z.infer<typeof seoFrontmatterSchema>;

export type SplitFrontmatter = {
  base: LocaleBaseColumns;
  data: Record<string, unknown>;
};

/**
 * Frontmatter nesnesini sütunlara ve `data` JSON'una ayırır. Bilinmeyen
 * alanlar sessizce düşürülmez, `data` içinde korunur: dosyadan içe aktarma
 * kayıpsız olmalı.
 */
export function splitFrontmatter(frontmatter: Record<string, unknown>): SplitFrontmatter {
  const data: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(frontmatter)) {
    if (!BASE_FIELDS[key]) data[key] = value;
  }
  return {
    base: {
      slug: String(frontmatter.slug ?? ''),
      title: String(frontmatter.title ?? ''),
      description: String(frontmatter.description ?? ''),
      primaryKeyword: String(frontmatter.primaryKeyword ?? ''),
      secondaryKeywords: Array.isArray(frontmatter.secondaryKeywords)
        ? frontmatter.secondaryKeywords.map(String)
        : [],
      ogImage: String(frontmatter.ogImage ?? ''),
      heroImage: String(frontmatter.heroImage ?? ''),
      heroImageAlt: String(frontmatter.heroImageAlt ?? ''),
      noindex: frontmatter.noindex === true,
    },
    data,
  };
}

export type ContentLocaleRow = {
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  ogImage: string;
  heroImage: string;
  heroImageAlt: string;
  noindex: boolean;
  data: unknown;
};

/** Satırı tekrar frontmatter nesnesine birleştirir; şema doğrulaması çağıranındır. */
export function mergeFrontmatter(row: ContentLocaleRow): Record<string, unknown> {
  const data =
    row.data && typeof row.data === 'object' && !Array.isArray(row.data)
      ? (row.data as Record<string, unknown>)
      : {};
  return {
    ...data,
    slug: row.slug,
    title: row.title,
    description: row.description,
    primaryKeyword: row.primaryKeyword,
    secondaryKeywords: row.secondaryKeywords,
    ogImage: row.ogImage,
    heroImage: row.heroImage,
    heroImageAlt: row.heroImageAlt,
    noindex: row.noindex,
  };
}
