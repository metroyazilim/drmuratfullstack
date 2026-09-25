import fs from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/mdx';
import { LOCALE, type Locale } from '@/lib/site-routes';
import {
  dbGetAlternates,
  dbGetClinic,
  dbGetEntry,
  dbGetFaq,
  dbGetGallery,
  dbGetHome,
  dbGetListing,
  dbListEntries,
  dbListSlugs,
  dbResolveIdBySlug,
} from './db-source';
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
  Post,
  PostSummary,
  TeamMember,
  TeamSummary,
  Page,
  Legal,
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

function readFileContent(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

interface RawEntity<T> {
  id: string;
  locale: Locale;
  frontmatter: T;
  rawBody: string;
}

const fileGetRawEntity = cache(
  <T>(
    type: ContentType,
    id: string,
    locale: Locale,
    schema: { parse: (value: unknown) => T },
  ): RawEntity<T> | null => {
    const filePath = path.join(CONTENT_DIR, type, id, `${locale}.mdx`);
    const fileContent = readFileContent(filePath);
    if (!fileContent) return null;

    try {
      const { data, content: rawBody } = matter(fileContent);
      return { id, locale, frontmatter: schema.parse(data), rawBody };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `[Content Layer Error] Failed parsing ${type}/${id}/${locale}.mdx: ${message}`,
      );
    }
  },
);

async function getRawEntity<T>(
  type: ContentType,
  id: string,
  locale: Locale,
  schema: {
    safeParse: (
      value: unknown,
    ) => { success: true; data: T } | { success: false; error: unknown };
    parse: (value: unknown) => T;
  },
): Promise<RawEntity<T> | null> {
  const databaseEntry = await dbGetEntry(type, id, locale);
  if (databaseEntry === null) return fileGetRawEntity(type, id, locale, schema);
  if (!databaseEntry) return null;

  const parsed = schema.safeParse(databaseEntry.frontmatter);
  if (!parsed.success) {
    console.error(`[Content DB] Geçersiz kayıt atlandı: ${type}/${id}/${locale}`, parsed.error);
    return null;
  }

  return {
    id: databaseEntry.id,
    locale: databaseEntry.locale,
    frontmatter: parsed.data,
    rawBody: databaseEntry.rawBody,
  };
}

const fileListEntityIds = cache((type: ContentType): string[] => {
  const dirPath = path.join(CONTENT_DIR, type);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
});

export const listEntityIds = cache(async (type: ContentType): Promise<string[]> => {
  const databaseEntries = await dbListEntries(type);
  if (databaseEntries === null) return fileListEntityIds(type);
  return [...new Set(databaseEntries.map((entry) => entry.id))];
});

type SlugFrontmatter = { slug: string };

function getSchema(type: ContentType): { parse: (value: unknown) => SlugFrontmatter } {
  if (type === 'services') return serviceFrontmatterSchema;
  if (type === 'blog') return postFrontmatterSchema;
  if (type === 'team') return teamFrontmatterSchema;
  if (type === 'pages') return pageFrontmatterSchema;
  return legalFrontmatterSchema;
}

const fileListSlugs = cache((type: ContentType, locale: Locale): string[] => {
  const schema = getSchema(type);
  return fileListEntityIds(type).flatMap((id) => {
    const entity = fileGetRawEntity(type, id, locale, schema);
    return entity ? [entity.frontmatter.slug] : [];
  });
});

export const listSlugs = cache(
  async (type: ContentType, locale: Locale): Promise<string[]> => {
    const databaseSlugs = await dbListSlugs(type, locale);
    return databaseSlugs ?? fileListSlugs(type, locale);
  },
);

const fileResolveIdBySlug = cache(
  (type: ContentType, locale: Locale, slug: string): string | null => {
    const schema = getSchema(type);
    for (const id of fileListEntityIds(type)) {
      const entity = fileGetRawEntity(type, id, locale, schema);
      if (entity?.frontmatter.slug === slug) return id;
    }
    return null;
  },
);

export const resolveIdBySlug = cache(
  async (type: ContentType, locale: Locale, slug: string): Promise<string | null> => {
    const databaseId = await dbResolveIdBySlug(type, locale, slug);
    if (databaseId !== null) return databaseId ?? null;
    return fileResolveIdBySlug(type, locale, slug);
  },
);

const fileGetAlternates = cache(
  (type: ContentType, id: string): Record<Locale, string> => {
    const alternates: Partial<Record<Locale, string>> = {};
    const schema = getSchema(type);
    const entity = fileGetRawEntity(type, id, LOCALE, schema);
    if (entity) alternates[LOCALE] = entity.frontmatter.slug;
    // Tek dil (tr) kalıcı olarak desteklenir; harita her zaman tek anahtarlıdır.
    return alternates as Record<Locale, string>;
  },
);

export const getAlternates = cache(
  async (type: ContentType, id: string): Promise<Record<Locale, string>> => {
    const databaseAlternates = await dbGetAlternates(type, id);
    if (databaseAlternates === null) return fileGetAlternates(type, id);
    // Publishing requires all four locales, so a published entry has a complete map.
    return databaseAlternates as Record<Locale, string>;
  },
);

export const listServices = cache(async (locale: Locale): Promise<ServiceSummary[]> => {
  const ids = await listEntityIds('services');
  const rows = await Promise.all(
    ids.map((id) => getRawEntity('services', id, locale, serviceFrontmatterSchema)),
  );

  return rows
    .flatMap((raw) =>
      raw
        ? [
            {
              id: raw.id,
              locale: raw.locale,
              title: raw.frontmatter.title,
              description: raw.frontmatter.description,
              shortDescription: raw.frontmatter.shortDescription,
              slug: raw.frontmatter.slug,
              cardImage: raw.frontmatter.cardImage,
              cardImageAlt: raw.frontmatter.cardImageAlt,
              order: raw.frontmatter.order,
            },
          ]
        : [],
    )
    .sort((a, b) => a.order - b.order);
});

export const getServiceById = cache(
  async (locale: Locale, id: string): Promise<Service | null> => {
    const raw = await getRawEntity('services', id, locale, serviceFrontmatterSchema);
    if (!raw) return null;

    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      description: raw.frontmatter.description,
      shortDescription: raw.frontmatter.shortDescription,
      slug: raw.frontmatter.slug,
      cardImage: raw.frontmatter.cardImage,
      cardImageAlt: raw.frontmatter.cardImageAlt,
      order: raw.frontmatter.order,
      frontmatter: raw.frontmatter,
    };
  },
);

export const getServiceBySlug = cache(
  async (locale: Locale, slug: string): Promise<Service | null> => {
    const id = await resolveIdBySlug('services', locale, slug);
    return id ? getServiceById(locale, id) : null;
  },
);

export const listPosts = cache(
  async (
    locale: Locale,
    opts?: { category?: string; page?: number; limit?: number },
  ): Promise<{ items: PostSummary[]; total: number; totalPages: number }> => {
    const ids = await listEntityIds('blog');
    const rows = await Promise.all(
      ids.map((id) => getRawEntity('blog', id, locale, postFrontmatterSchema)),
    );
    let items = rows.flatMap((raw) =>
      raw
        ? [
            {
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
            },
          ]
        : [],
    );

    if (opts?.category) items = items.filter((item) => item.category === opts.category);
    items.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    const total = items.length;
    const limit = opts?.limit ?? 10;
    const page = opts?.page ?? 1;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    return { items: items.slice(start, start + limit), total, totalPages };
  },
);

export const getPostById = cache(
  async (locale: Locale, id: string): Promise<Post | null> => {
    const raw = await getRawEntity('blog', id, locale, postFrontmatterSchema);
    if (!raw) return null;

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
      frontmatter: raw.frontmatter,
    };
  },
);

export const getPostBySlug = cache(
  async (locale: Locale, slug: string): Promise<Post | null> => {
    const id = await resolveIdBySlug('blog', locale, slug);
    return id ? getPostById(locale, id) : null;
  },
);

export const listTeam = cache(async (locale: Locale): Promise<TeamSummary[]> => {
  const ids = await listEntityIds('team');
  const rows = await Promise.all(
    ids.map((id) => getRawEntity('team', id, locale, teamFrontmatterSchema)),
  );

  return rows
    .flatMap((raw) =>
      raw
        ? [
            {
              id: raw.id,
              locale: raw.locale,
              name: raw.frontmatter.name,
              role: raw.frontmatter.role,
              slug: raw.frontmatter.slug,
              photo: raw.frontmatter.photo,
              photoAlt: raw.frontmatter.photoAlt,
              order: raw.frontmatter.order,
            },
          ]
        : [],
    )
    .sort((a, b) => a.order - b.order);
});

export const getTeamMemberBySlug = cache(
  async (locale: Locale, slug: string): Promise<TeamMember | null> => {
    const id = await resolveIdBySlug('team', locale, slug);
    if (!id) return null;

    const raw = await getRawEntity('team', id, locale, teamFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({ source: raw.rawBody, components: mdxComponents });
    return {
      id: raw.id,
      locale: raw.locale,
      name: raw.frontmatter.name,
      role: raw.frontmatter.role,
      slug: raw.frontmatter.slug,
      photo: raw.frontmatter.photo,
      photoAlt: raw.frontmatter.photoAlt,
      order: raw.frontmatter.order,
      frontmatter: raw.frontmatter,
      content,
    };
  },
);

export const getPage = cache(
  async (locale: Locale, key: string): Promise<Page | null> => {
    const raw = await getRawEntity('pages', key, locale, pageFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({ source: raw.rawBody, components: mdxComponents });
    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      slug: raw.frontmatter.slug,
      frontmatter: raw.frontmatter,
      content,
    };
  },
);

export const getLegal = cache(
  async (locale: Locale, slug: string): Promise<Legal | null> => {
    const id = await resolveIdBySlug('legal', locale, slug);
    if (!id) return null;

    const raw = await getRawEntity('legal', id, locale, legalFrontmatterSchema);
    if (!raw) return null;

    const { content } = await compileMDX({ source: raw.rawBody, components: mdxComponents });
    return {
      id: raw.id,
      locale: raw.locale,
      title: raw.frontmatter.title,
      slug: raw.frontmatter.slug,
      frontmatter: raw.frontmatter,
      content,
    };
  },
);

function fileGetFaq(locale: Locale): FaqItem[] {
  const filePath = path.join(CONTENT_DIR, 'faq', `${locale}.json`);
  const content = readFileContent(filePath);
  if (!content) return [];
  try {
    const parsed: unknown = JSON.parse(content);
    return faqListSchema.parse(parsed);
  } catch (error: unknown) {
    throw new Error(
      `[Content Layer Error] Failed parsing faq/${locale}.json: ${String(error)}`,
    );
  }
}

export const getFaq = cache(async (locale: Locale): Promise<FaqItem[]> => {
  return (await dbGetFaq(locale)) ?? fileGetFaq(locale);
});

function fileGetGallery(locale: Locale): GalleryItem[] {
  const imagesContent = readFileContent(path.join(CONTENT_DIR, 'gallery', 'images.json'));
  const altContent = readFileContent(
    path.join(CONTENT_DIR, 'gallery', `alt.${locale}.json`),
  );
  if (!imagesContent || !altContent) return [];

  const images: unknown = JSON.parse(imagesContent);
  const alts: unknown = JSON.parse(altContent);
  if (!Array.isArray(images) || !alts || typeof alts !== 'object' || Array.isArray(alts)) {
    throw new Error(`[Content Layer Error] Failed parsing gallery/${locale}`);
  }

  return images.flatMap((image) => {
    if (typeof image !== 'string') return [];
    const alt = Reflect.get(alts, image);
    return [{ image, alt: typeof alt === 'string' ? alt : '' }];
  });
}

export const getGallery = cache(async (locale: Locale): Promise<GalleryItem[]> => {
  return (await dbGetGallery(locale)) ?? fileGetGallery(locale);
});

function fileGetClinic(): Clinic {
  const content = readFileContent(path.join(CONTENT_DIR, 'clinic.json'));
  if (!content) throw new Error('[Content Layer Error] clinic.json file not found');
  const parsed: unknown = JSON.parse(content);
  return clinicSchema.parse(parsed);
}

export const getClinic = cache(async (): Promise<Clinic> => {
  return (await dbGetClinic()) ?? fileGetClinic();
});

function fileGetHome(locale: Locale): Home {
  const filePath = path.join(CONTENT_DIR, 'home', `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`[Content Layer Error] content/home/${locale}.json bulunamadı`);
  }
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return homeSchema.parse(parsed);
}

export const getHome = cache(async (locale: Locale): Promise<Home> => {
  return (await dbGetHome(locale)) ?? fileGetHome(locale);
});

type ListingResultMap = {
  services: ServicesListing;
  blog: ListingBase;
  gallery: ListingBase;
  team: TeamListing;
  faq: FaqListing;
  appointment: AppointmentListing;
  contact: ContactListing;
};

function fileGetListing<K extends ListingKey>(key: K, locale: Locale): ListingResultMap[K] {
  const filePath = path.join(CONTENT_DIR, 'listing', key, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`[Content Layer Error] content/listing/${key}/${locale}.json bulunamadı`);
  }

  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  // The selected schema and generic key share the same ListingResultMap member.
  return listingSchemas[key].parse(parsed) as ListingResultMap[K];
}

export const getListing = cache(
  async <K extends ListingKey>(key: K, locale: Locale): Promise<ListingResultMap[K]> => {
    return (await dbGetListing(key, locale)) ?? fileGetListing(key, locale);
  },
);
