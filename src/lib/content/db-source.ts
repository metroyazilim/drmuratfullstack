import 'server-only';

import { ContentStatus, ContentType as PrismaContentType } from '@prisma/client';
import { cache } from 'react';
import { CONTENT_TYPES, mergeFrontmatter } from '@/lib/admin/content-model';
import { getPrisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import type { Locale } from '@/lib/site-routes';
import {
  clinicSchema,
  faqItemSchema,
  homeSchema,
  listingSchemas,
  type ListingKey,
} from './schemas';
import type {
  AppointmentListing,
  Clinic,
  ContactListing,
  ContentType,
  FaqItem,
  FaqListing,
  GalleryItem,
  Home,
  ListingBase,
  ServicesListing,
  TeamListing,
} from './types';

export type DbContentEntry = {
  id: string;
  locale: Locale;
  frontmatter: Record<string, unknown>;
  rawBody: string;
  order: number;
};

type ListingResultMap = {
  services: ServicesListing;
  blog: ListingBase;
  gallery: ListingBase;
  team: TeamListing;
  faq: FaqListing;
  appointment: AppointmentListing;
  contact: ContactListing;
};

const PRISMA_TYPE_BY_CONTENT_TYPE: Readonly<Record<ContentType, PrismaContentType>> = {
  services: PrismaContentType.SERVICE,
  blog: PrismaContentType.POST,
  team: PrismaContentType.TEAM,
  pages: PrismaContentType.PAGE,
  legal: PrismaContentType.LEGAL,
};

function logInvalidRecord(source: string, error: unknown): void {
  console.error(`[Content DB] Geçersiz kayıt atlandı: ${source}`, error);
}

/**
 * A configured database is optional during local development and while a
 * deployment is recovering. Query failures therefore return `null`, which
 * tells the content facade to use the bundled source instead of turning a
 * public page into a 500 response.
 */
async function readDatabase<T>(source: string, query: () => Promise<T>): Promise<T | null> {
  try {
    return await query();
  } catch (error) {
    console.error(`[Content DB] ${source} okunamadı; paketlenmiş içerik kullanılacak.`, error);
    return null;
  }
}

const loadEntries = cache(async (type: ContentType): Promise<DbContentEntry[] | null> => {
  if (!hasDatabase()) return null;

  const prismaType = PRISMA_TYPE_BY_CONTENT_TYPE[type];
  const rows = await readDatabase('içerik kayıtları', () =>
    getPrisma().contentEntry.findMany({
      where: { type: prismaType, status: ContentStatus.PUBLISHED },
      include: { locales: true },
      orderBy: [{ order: 'asc' }, { key: 'asc' }],
    }),
  );

  if (rows === null || rows.length === 0) return null;

  const schema = CONTENT_TYPES[prismaType].schema;
  const entries: DbContentEntry[] = [];

  for (const row of rows) {
    for (const localized of row.locales) {
      const locale = localized.locale;
      if (locale !== 'tr') continue;

      const result = schema.safeParse(mergeFrontmatter(localized));
      if (!result.success) {
        logInvalidRecord(`${type}/${row.key}/${locale}`, result.error.flatten());
        continue;
      }

      entries.push({
        id: row.key,
        locale,
        frontmatter: result.data,
        rawBody: localized.body,
        order: row.order,
      });
    }
  }

  return entries;
});

export async function dbListEntries(type: ContentType): Promise<DbContentEntry[] | null> {
  return loadEntries(type);
}

export async function dbGetEntry(
  type: ContentType,
  key: string,
  locale: Locale,
): Promise<DbContentEntry | null | undefined> {
  const entries = await loadEntries(type);
  if (entries === null) return null;
  return entries.find((entry) => entry.id === key && entry.locale === locale);
}

export async function dbResolveIdBySlug(
  type: ContentType,
  locale: Locale,
  slug: string,
): Promise<string | null | undefined> {
  const entries = await loadEntries(type);
  if (entries === null) return null;
  return entries.find(
    (entry) => entry.locale === locale && entry.frontmatter.slug === slug,
  )?.id;
}

export async function dbListSlugs(
  type: ContentType,
  locale: Locale,
): Promise<string[] | null> {
  const entries = await loadEntries(type);
  if (entries === null) return null;

  return entries.flatMap((entry) => {
    const slug = entry.frontmatter.slug;
    return entry.locale === locale && typeof slug === 'string' ? [slug] : [];
  });
}

export async function dbGetAlternates(
  type: ContentType,
  key: string,
): Promise<Partial<Record<Locale, string>> | null> {
  const entries = await loadEntries(type);
  if (entries === null) return null;

  const alternates: Partial<Record<Locale, string>> = {};
  for (const entry of entries) {
    const slug = entry.frontmatter.slug;
    if (entry.id === key && typeof slug === 'string') {
      alternates[entry.locale] = slug;
    }
  }
  return alternates;
}

export async function dbGetFaq(locale: Locale): Promise<FaqItem[] | null> {
  if (!hasDatabase()) return null;

  const rows = await readDatabase('SSS kayıtları', () =>
    getPrisma().faqEntry.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: { locales: { where: { locale } } },
      orderBy: [{ order: 'asc' }, { key: 'asc' }],
    }),
  );
  if (rows === null || rows.length === 0) return null;

  const items: FaqItem[] = [];
  for (const row of rows) {
    const localized = row.locales[0];
    if (!localized) continue;

    const result = faqItemSchema.safeParse({
      id: row.key,
      question: localized.question,
      answer: localized.answer,
      category: localized.category ?? undefined,
    });
    if (!result.success) {
      logInvalidRecord(`faq/${row.key}/${locale}`, result.error.flatten());
      continue;
    }
    items.push(result.data);
  }
  return items;
}

export async function dbGetGallery(locale: Locale): Promise<GalleryItem[] | null> {
  if (!hasDatabase()) return null;

  const rows = await readDatabase('galeri kayıtları', () =>
    getPrisma().galleryImage.findMany({
      where: { status: ContentStatus.PUBLISHED },
      include: { alts: { where: { locale } } },
      orderBy: [{ order: 'asc' }, { path: 'asc' }],
    }),
  );
  if (rows === null || rows.length === 0) return null;

  const items: GalleryItem[] = [];
  for (const row of rows) {
    const localized = row.alts[0];
    if (!localized || localized.alt.trim().length === 0) {
      logInvalidRecord(`gallery/${row.path}/${locale}`, 'Alt metni eksik');
      continue;
    }
    items.push({ image: row.path, alt: localized.alt });
  }
  return items;
}

export async function dbGetHome(locale: Locale): Promise<Home | null> {
  if (!hasDatabase()) return null;

  const row = await readDatabase('anasayfa içeriği', () =>
    getPrisma().homeContent.findUnique({ where: { locale } }),
  );
  if (!row) return null;

  const result = homeSchema.safeParse(row.data);
  if (!result.success) {
    logInvalidRecord(`home/${locale}`, result.error.flatten());
    return null;
  }
  return result.data;
}

export async function dbGetListing<K extends ListingKey>(
  key: K,
  locale: Locale,
): Promise<ListingResultMap[K] | null> {
  if (!hasDatabase()) return null;

  const row = await readDatabase('liste içeriği', () =>
    getPrisma().listingContent.findUnique({
      where: { key_locale: { key, locale } },
    }),
  );
  if (!row) return null;

  const result = listingSchemas[key].safeParse(row.data);
  if (!result.success) {
    logInvalidRecord(`listing/${key}/${locale}`, result.error.flatten());
    return null;
  }
  // The selected schema and generic key share the same ListingResultMap member.
  return result.data as ListingResultMap[K];
}

export async function dbGetClinic(): Promise<Clinic | null> {
  if (!hasDatabase()) return null;

  const row = await readDatabase('klinik ayarları', () =>
    getPrisma().siteSettings.findUnique({ where: { singleton: true } }),
  );
  if (!row?.clinic) return null;

  const result = clinicSchema.safeParse(row.clinic);
  if (!result.success) {
    logInvalidRecord('clinic', result.error.flatten());
    return null;
  }
  return result.data;
}
