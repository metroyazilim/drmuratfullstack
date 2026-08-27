import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx';
import { routing, type Locale } from '@/lib/i18n';
import {
  serviceFrontmatterSchema,
  postFrontmatterSchema,
  teamFrontmatterSchema,
  pageFrontmatterSchema,
  legalFrontmatterSchema,
  faqListSchema,
  clinicSchema,
  homeSchema,
  listingSchemas,
  type ListingKey,
} from './schemas';
import type {
  ContentType,
  Service,
  ServiceSummary,
  ServiceFrontmatter,
  Post,
  PostSummary,
  PostFrontmatter,
  TeamMember,
  TeamSummary,
  TeamFrontmatter,
  Page,
  PageFrontmatter,
  Legal,
  LegalFrontmatter,
  FaqItem,
  GalleryItem,
  Clinic,
  Home,
  ListingBase,
  ServicesListing,
  TeamListing,
  FaqListing,
  AppointmentListing,
  ContactListing,
} from './types';

export * from './types';
export * from './schemas';

const CONTENT_DIR = path.join(process.cwd(), 'content');

// Helper to read file safely
function readFileContent(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

// 1. Raw Frontmatter & Body Readers (Cached)
interface RawEntity<T> {
  id: string;
  locale: Locale;
  frontmatter: T;
  rawBody: string;
}

const getRawEntity = cache(
  <T>(
    type: ContentType,
    id: string,
    locale: Locale,
    schema: { parse: (val: unknown) => T },
  ): RawEntity<T> | null => {
    const filePath = path.join(CONTENT_DIR, type, id, `${locale}.mdx`);
    const fileContent = readFileContent(filePath);
    if (!fileContent) return null;

    try {
      const { data, content: rawBody } = matter(fileContent);
      const frontmatter = schema.parse(data);
      return { id, locale, frontmatter, rawBody };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `[Content Layer Error] Failed parsing ${type}/${id}/${locale}.mdx: ${errorMsg}`,
      );
    }
  },
);

// List directory IDs for a content type
export const listEntityIds = cache((type: ContentType): string[] => {
  const dirPath = path.join(CONTENT_DIR, type);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
});

// 2. Routing, Slugs & Alternates
export const listSlugs = cache(
  (type: ContentType, locale: Locale): string[] => {
    const ids = listEntityIds(type);
    const slugs: string[] = [];

    for (const id of ids) {
      const entity = getRawEntity(
        type,
        id,
        locale,
        type === 'services'
          ? serviceFrontmatterSchema
          : type === 'blog'
            ? postFrontmatterSchema
            : type === 'team'
              ? teamFrontmatterSchema
              : type === 'pages'
                ? pageFrontmatterSchema
                : legalFrontmatterSchema,
      );
      if (entity) {
        slugs.push(entity.frontmatter.slug);
      }
    }
    return slugs;
  },
);

export const resolveIdBySlug = cache(
  (type: ContentType, locale: Locale, slug: string): string | null => {
    const ids = listEntityIds(type);
    for (const id of ids) {
      const entity = getRawEntity(
        type,
        id,
        locale,
        type === 'services'
          ? serviceFrontmatterSchema
          : type === 'blog'
            ? postFrontmatterSchema
            : type === 'team'
              ? teamFrontmatterSchema
              : type === 'pages'
                ? pageFrontmatterSchema
                : legalFrontmatterSchema,
      );
      if (entity && entity.frontmatter.slug === slug) {
        return id;
      }
    }
    return null;
  },
);

export const getAlternates = cache(
  (type: ContentType, id: string): Record<Locale, string> => {
    const alternates: Partial<Record<Locale, string>> = {};

    for (const locale of routing.locales) {
      const entity = getRawEntity(
        type,
        id,
        locale,
        type === 'services'
          ? serviceFrontmatterSchema
          : type === 'blog'
            ? postFrontmatterSchema
            : type === 'team'
              ? teamFrontmatterSchema
              : type === 'pages'
                ? pageFrontmatterSchema
                : legalFrontmatterSchema,
      );
      if (entity) {
        alternates[locale] = entity.frontmatter.slug;
      }
    }
    return alternates as Record<Locale, string>;
  },
);

// 3. Services API
export const listServices = cache((locale: Locale): ServiceSummary[] => {
  const ids = listEntityIds('services');
  const items: ServiceSummary[] = [];

  for (const id of ids) {
    const raw = getRawEntity('services', id, locale, serviceFrontmatterSchema);
    if (raw) {
      items.push({
        id: raw.id,
        locale: raw.locale,
        title: raw.frontmatter.title,
        description: raw.frontmatter.description,
        shortDescription: raw.frontmatter.shortDescription,
        slug: raw.frontmatter.slug,
        cardImage: raw.frontmatter.cardImage,
        cardImageAlt: raw.frontmatter.cardImageAlt,
        cardTags: raw.frontmatter.cardTags,
        order: raw.frontmatter.order,
      });
    }
  }

  return items.sort((a, b) => a.order - b.order);
});

export const getServiceById = cache(
  async (locale: Locale, id: string): Promise<Service | null> => {
    const raw = getRawEntity('services', id, locale, serviceFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({
      source: raw.rawBody,
      components: mdxComponents,
    });

    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      description: raw.frontmatter.description,
      shortDescription: raw.frontmatter.shortDescription,
      slug: raw.frontmatter.slug,
      cardImage: raw.frontmatter.cardImage,
      cardImageAlt: raw.frontmatter.cardImageAlt,
      cardTags: raw.frontmatter.cardTags,
      order: raw.frontmatter.order,
      frontmatter: raw.frontmatter as ServiceFrontmatter,
      content,
    };
  },
);

export const getServiceBySlug = cache(
  async (locale: Locale, slug: string): Promise<Service | null> => {
    const id = resolveIdBySlug('services', locale, slug);
    if (!id) return null;
    return getServiceById(locale, id);
  },
);

// 4. Blog Posts API
export const listPosts = cache(
  (
    locale: Locale,
    opts?: { category?: string; page?: number; limit?: number },
  ): { items: PostSummary[]; total: number; totalPages: number } => {
    const ids = listEntityIds('blog');
    let items: PostSummary[] = [];

    for (const id of ids) {
      const raw = getRawEntity('blog', id, locale, postFrontmatterSchema);
      if (raw) {
        items.push({
          id: raw.id,
          locale: raw.locale,
          title: raw.frontmatter.title,
          description: raw.frontmatter.description,
          slug: raw.frontmatter.slug,
          heroImage: raw.frontmatter.heroImage,
          heroImageAlt: raw.frontmatter.heroImageAlt,
          publishedAt: raw.frontmatter.publishedAt,
          updatedAt: raw.frontmatter.updatedAt,
          category: raw.frontmatter.category,
          author: raw.frontmatter.author,
        });
      }
    }

    if (opts?.category) {
      items = items.filter((item) => item.category === opts.category);
    }

    // Sort newest published first
    items.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    const total = items.length;
    const limit = opts?.limit ?? 10;
    const page = opts?.page ?? 1;
    const totalPages = Math.ceil(total / limit);

    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return { items: paginatedItems, total, totalPages };
  },
);

export const getPostById = cache(
  async (locale: Locale, id: string): Promise<Post | null> => {
    const raw = getRawEntity('blog', id, locale, postFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({
      source: raw.rawBody,
      components: mdxComponents,
    });

    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      description: raw.frontmatter.description,
      slug: raw.frontmatter.slug,
      heroImage: raw.frontmatter.heroImage,
      heroImageAlt: raw.frontmatter.heroImageAlt,
      publishedAt: raw.frontmatter.publishedAt,
      updatedAt: raw.frontmatter.updatedAt,
      category: raw.frontmatter.category,
      author: raw.frontmatter.author,
      frontmatter: raw.frontmatter as PostFrontmatter,
      content,
    };
  },
);

export const getPostBySlug = cache(
  async (locale: Locale, slug: string): Promise<Post | null> => {
    const id = resolveIdBySlug('blog', locale, slug);
    if (!id) return null;
    return getPostById(locale, id);
  },
);

// 5. Team API
export const listTeam = cache((locale: Locale): TeamSummary[] => {
  const ids = listEntityIds('team');
  const items: TeamSummary[] = [];

  for (const id of ids) {
    const raw = getRawEntity('team', id, locale, teamFrontmatterSchema);
    if (raw) {
      items.push({
        id: raw.id,
        locale: raw.locale,
        name: raw.frontmatter.name,
        role: raw.frontmatter.role,
        slug: raw.frontmatter.slug,
        photo: raw.frontmatter.photo,
        photoAlt: raw.frontmatter.photoAlt,
        order: raw.frontmatter.order,
      });
    }
  }

  return items.sort((a, b) => a.order - b.order);
});

export const getTeamMemberBySlug = cache(
  async (locale: Locale, slug: string): Promise<TeamMember | null> => {
    const id = resolveIdBySlug('team', locale, slug);
    if (!id) return null;

    const raw = getRawEntity('team', id, locale, teamFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({
      source: raw.rawBody,
      components: mdxComponents,
    });

    return {
      id: raw.id,
      locale: raw.locale,
      name: raw.frontmatter.name,
      role: raw.frontmatter.role,
      slug: raw.frontmatter.slug,
      photo: raw.frontmatter.photo,
      photoAlt: raw.frontmatter.photoAlt,
      order: raw.frontmatter.order,
      frontmatter: raw.frontmatter as TeamFrontmatter,
      content,
    };
  },
);

// 6. Pages API (about, mission, vision, quality)
export const getPage = cache(
  async (locale: Locale, key: string): Promise<Page | null> => {
    const raw = getRawEntity('pages', key, locale, pageFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({
      source: raw.rawBody,
      components: mdxComponents,
    });

    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      slug: raw.frontmatter.slug,
      frontmatter: raw.frontmatter as PageFrontmatter,
      content,
    };
  },
);

// 7. Legal Pages API
export const getLegal = cache(
  async (locale: Locale, slug: string): Promise<Legal | null> => {
    const id = resolveIdBySlug('legal', locale, slug);
    if (!id) return null;

    const raw = getRawEntity('legal', id, locale, legalFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({
      source: raw.rawBody,
      components: mdxComponents,
    });

    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      slug: raw.frontmatter.slug,
      frontmatter: raw.frontmatter as LegalFrontmatter,
      content,
    };
  },
);

// 8. FAQ JSON API
export const getFaq = cache((locale: Locale): FaqItem[] => {
  const filePath = path.join(CONTENT_DIR, 'faq', `${locale}.json`);
  const content = readFileContent(filePath);
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    return faqListSchema.parse(parsed);
  } catch (err) {
    throw new Error(
      `[Content Layer Error] Failed parsing faq/${locale}.json: ${String(err)}`,
    );
  }
});

// 9. Gallery JSON API
export const getGallery = cache((locale: Locale): GalleryItem[] => {
  const imagesPath = path.join(CONTENT_DIR, 'gallery', 'images.json');
  const altPath = path.join(CONTENT_DIR, 'gallery', `alt.${locale}.json`);

  const imagesContent = readFileContent(imagesPath);
  const altContent = readFileContent(altPath);

  if (!imagesContent || !altContent) return [];

  const images: string[] = JSON.parse(imagesContent);
  const alts: Record<string, string> = JSON.parse(altContent);

  return images.map((image) => ({
    image,
    alt: alts[image] || '',
  }));
});

// 10. Clinic JSON API
export const getClinic = cache((): Clinic => {
  const filePath = path.join(CONTENT_DIR, 'clinic.json');
  const content = readFileContent(filePath);
  if (!content) {
    throw new Error('[Content Layer Error] clinic.json file not found');
  }
  const parsed = JSON.parse(content);
  return clinicSchema.parse(parsed);
});

/**
 * Anasayfa bölüm verisi. Yapılandırılmış olduğu için MDX değil JSON;
 * okuma yolu diğerleriyle aynı: dosya → zod → tip güvenli nesne.
 */
export const getHome = cache((locale: Locale): Home => {
  const filePath = path.join(CONTENT_DIR, 'home', `${locale}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`[Content Layer Error] content/home/${locale}.json bulunamadı`);
  }

  return homeSchema.parse(JSON.parse(fs.readFileSync(filePath, 'utf8')));
});

/**
 * Liste sayfası çerçeve metni.
 *
 * Dönüş tipi anahtara göre daralır: `services` ek olarak `approach` taşır,
 * `blog` taşımaz. Tek bir geniş tip döndürülürse blog listesi olmayan bir
 * alanı okumaya çalışır ve çalışma zamanında patlar.
 */
type ListingResultMap = {
  services: ServicesListing;
  blog: ListingBase;
  gallery: ListingBase;
  team: TeamListing;
  faq: FaqListing;
  appointment: AppointmentListing;
  contact: ContactListing;
};

export const getListing = cache(
  <K extends ListingKey>(key: K, locale: Locale): ListingResultMap[K] => {
    const filePath = path.join(CONTENT_DIR, 'listing', key, `${locale}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `[Content Layer Error] content/listing/${key}/${locale}.json bulunamadı`,
      );
    }

    return listingSchemas[key].parse(
      JSON.parse(fs.readFileSync(filePath, 'utf8')),
    ) as ListingResultMap[K];
  },
);
