import fs from 'node:fs';
import path from 'node:path';
import {
  ContentStatus,
  PrismaClient,
  type ContentType,
  type Prisma,
} from '@prisma/client';
import matter from 'gray-matter';
import { z } from 'zod';
import {
  CONTENT_TYPE_ORDER,
  CONTENT_TYPES,
  splitFrontmatter,
} from '../src/lib/admin/content-model';
import { ADMIN_LOCALES, type Locale } from '../src/lib/admin/locales';
import {
  clinicSchema,
  faqListSchema,
  homeSchema,
  listingSchemas,
  type ListingKey,
} from '../src/lib/content/schemas';

const prisma = new PrismaClient();
const contentDir = path.join(process.cwd(), 'content');
// Single-locale cutover: one Turkish source row per content asset.
const expectedSourceFileCount = 40;
const galleryImagesSchema = z.array(z.string().min(1));
const galleryAltsSchema = z.record(z.string().min(1));

type SummaryKey = ContentType | 'FAQ' | 'GALLERY' | 'HOME' | 'LISTING' | 'CLINIC';
type SummaryRow = { assets: number; localeRows: number; warnings: number };

const summary: Record<SummaryKey, SummaryRow> = {
  SERVICE: { assets: 0, localeRows: 0, warnings: 0 },
  POST: { assets: 0, localeRows: 0, warnings: 0 },
  TEAM: { assets: 0, localeRows: 0, warnings: 0 },
  PAGE: { assets: 0, localeRows: 0, warnings: 0 },
  LEGAL: { assets: 0, localeRows: 0, warnings: 0 },
  FAQ: { assets: 0, localeRows: 0, warnings: 0 },
  GALLERY: { assets: 0, localeRows: 0, warnings: 0 },
  HOME: { assets: 0, localeRows: 0, warnings: 0 },
  LISTING: { assets: 0, localeRows: 0, warnings: 0 },
  CLINIC: { assets: 0, localeRows: 0, warnings: 0 },
};

let sourceFilesRead = 0;

function readText(relativePath: string): string {
  const absolutePath = path.join(contentDir, relativePath);
  sourceFilesRead += 1;
  return fs.readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath: string): unknown {
  return JSON.parse(readText(relativePath));
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    return value.map((item) => (item === null ? null : toInputJson(item)));
  }
  if (value && typeof value === 'object') {
    const object: { [key: string]: Prisma.InputJsonValue | null } = {};
    for (const [key, item] of Object.entries(value)) {
      if (item !== undefined) object[key] = item === null ? null : toInputJson(item);
    }
    return object;
  }
  throw new Error('İçerikte JSON olarak saklanamayan bir değer bulundu.');
}

function addWarning(key: SummaryKey, message: string): void {
  summary[key].warnings += 1;
  console.warn(`Uyarı: ${message}`);
}

function isListingKey(value: string): value is ListingKey {
  return Object.hasOwn(listingSchemas, value);
}

async function importEntries(): Promise<void> {
  for (const type of CONTENT_TYPE_ORDER) {
    const meta = CONTENT_TYPES[type];
    const typeDir = path.join(contentDir, meta.contentDir);
    const entityKeys = fs
      .readdirSync(typeDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((left, right) => left.localeCompare(right));

    for (const [index, key] of entityKeys.entries()) {
      const localizedRows: Array<{
        locale: Locale;
        frontmatter: Record<string, unknown>;
        body: string;
      }> = [];

      for (const locale of ADMIN_LOCALES) {
        const relativePath = path.join(meta.contentDir, key, `${locale}.mdx`);
        const parsedFile = matter(readText(relativePath));
        const rawFrontmatter: unknown = parsedFile.data;
        const frontmatter = meta.schema.parse(rawFrontmatter);
        localizedRows.push({ locale, frontmatter, body: parsedFile.content });
      }

      const preferredFrontmatter = localizedRows[0]?.frontmatter;
      const order =
        preferredFrontmatter &&
        'order' in preferredFrontmatter &&
        typeof preferredFrontmatter.order === 'number'
          ? preferredFrontmatter.order
          : index + 1;

      const entry = await prisma.contentEntry.upsert({
        where: { type_key: { type, key } },
        create: {
          type,
          key,
          status: ContentStatus.PUBLISHED,
          order,
          publishedAt: new Date(),
        },
        update: { status: ContentStatus.PUBLISHED, order },
      });

      for (const localized of localizedRows) {
        const split = splitFrontmatter(localized.frontmatter);
        const data = {
          type,
          locale: localized.locale,
          slug: split.base.slug,
          title: split.base.title,
          description: split.base.description,
          primaryKeyword: split.base.primaryKeyword,
          secondaryKeywords: split.base.secondaryKeywords,
          ogImage: split.base.ogImage,
          heroImage: split.base.heroImage,
          heroImageAlt: split.base.heroImageAlt,
          noindex: split.base.noindex,
          body: localized.body,
          data: toInputJson(split.data),
        };

        await prisma.contentLocale.upsert({
          where: { entryId_locale: { entryId: entry.id, locale: localized.locale } },
          create: { entryId: entry.id, ...data },
          update: data,
        });
      }

      summary[type].assets += 1;
      summary[type].localeRows += localizedRows.length;
    }
  }
}

async function importFaq(): Promise<void> {
  const lists = new Map<Locale, z.infer<typeof faqListSchema>>();
  for (const locale of ADMIN_LOCALES) {
    lists.set(locale, faqListSchema.parse(readJson(path.join('faq', `${locale}.json`))));
  }

  const baseList = lists.get('tr');
  if (!baseList) throw new Error('content/faq/tr.json bulunamadı.');
  const baseKeys = baseList.map((item) => item.id);

  for (const locale of ADMIN_LOCALES) {
    const localizedKeys = lists.get(locale)?.map((item) => item.id) ?? [];
    if (localizedKeys.join('\u0000') !== baseKeys.join('\u0000')) {
      throw new Error(`FAQ kimlikleri veya sırası ${locale} dilinde Türkçe ile eşleşmiyor.`);
    }
  }

  for (const [index, key] of baseKeys.entries()) {
    const entry = await prisma.faqEntry.upsert({
      where: { key },
      create: { key, order: index + 1, status: ContentStatus.PUBLISHED },
      update: { order: index + 1, status: ContentStatus.PUBLISHED },
    });

    for (const locale of ADMIN_LOCALES) {
      const item = lists.get(locale)?.[index];
      if (!item || item.id !== key) {
        throw new Error(`FAQ ${key} için ${locale} dil satırı bulunamadı.`);
      }
      const data = {
        question: item.question,
        answer: item.answer,
        category: item.category ?? null,
      };
      await prisma.faqLocale.upsert({
        where: { entryId_locale: { entryId: entry.id, locale } },
        create: { entryId: entry.id, locale, ...data },
        update: data,
      });
      summary.FAQ.localeRows += 1;
    }
    summary.FAQ.assets += 1;
  }
}

async function importGallery(): Promise<void> {
  const images = galleryImagesSchema.parse(readJson(path.join('gallery', 'images.json')));
  const alts = new Map<Locale, Record<string, string>>();

  for (const locale of ADMIN_LOCALES) {
    const localized = galleryAltsSchema.parse(
      readJson(path.join('gallery', `alt.${locale}.json`)),
    );
    for (const image of images) {
      if (!localized[image]) {
        throw new Error(`${image} görselinin ${locale} alt metni eksik.`);
      }
    }
    for (const image of Object.keys(localized)) {
      if (!images.includes(image)) {
        addWarning('GALLERY', `${locale} alt dosyasında kullanılmayan görsel var: ${image}`);
      }
    }
    alts.set(locale, localized);
  }

  for (const [index, image] of images.entries()) {
    const row = await prisma.galleryImage.upsert({
      where: { path: image },
      create: { path: image, order: index + 1, status: ContentStatus.PUBLISHED },
      update: { order: index + 1, status: ContentStatus.PUBLISHED },
    });

    for (const locale of ADMIN_LOCALES) {
      const alt = alts.get(locale)?.[image];
      if (!alt) throw new Error(`${image} görselinin ${locale} alt metni eksik.`);
      await prisma.galleryAlt.upsert({
        where: { imageId_locale: { imageId: row.id, locale } },
        create: { imageId: row.id, locale, alt },
        update: { alt },
      });
      summary.GALLERY.localeRows += 1;
    }
    summary.GALLERY.assets += 1;
  }
}

async function importHome(): Promise<void> {
  for (const locale of ADMIN_LOCALES) {
    const parsed = homeSchema.parse(readJson(path.join('home', `${locale}.json`)));
    const data = toInputJson(parsed);
    await prisma.homeContent.upsert({
      where: { locale },
      create: { locale, data },
      update: { data },
    });
    summary.HOME.localeRows += 1;
  }
  summary.HOME.assets = 1;
}

async function importListings(): Promise<void> {
  const keys = Object.keys(listingSchemas);
  for (const key of keys) {
    if (!isListingKey(key)) {
      throw new Error(`Desteklenmeyen liste anahtarı: ${key}`);
    }
    for (const locale of ADMIN_LOCALES) {
      const parsed = listingSchemas[key].parse(
        readJson(path.join('listing', key, `${locale}.json`)),
      );
      const data = toInputJson(parsed);
      await prisma.listingContent.upsert({
        where: { key_locale: { key, locale } },
        create: { key, locale, data },
        update: { data },
      });
      summary.LISTING.localeRows += 1;
    }
    summary.LISTING.assets += 1;
  }
}

async function importClinic(): Promise<void> {
  const clinic = clinicSchema.parse(readJson('clinic.json'));
  const data = toInputJson(clinic);
  await prisma.siteSettings.upsert({
    where: { singleton: true },
    create: { singleton: true, clinic: data },
    update: { clinic: data },
  });
  summary.CLINIC.assets = 1;
}

async function main(): Promise<void> {
  await importEntries();
  await importFaq();
  await importGallery();
  await importHome();
  await importListings();
  await importClinic();

  if (sourceFilesRead !== expectedSourceFileCount) {
    throw new Error(
      `İçe aktarma ${sourceFilesRead} dosya okudu; beklenen ${expectedSourceFileCount}. Kapsamı güncelleyin.`,
    );
  }

  console.table(
    Object.entries(summary).map(([type, row]) => ({
      Tip: type,
      Varlık: row.assets,
      'Dil satırı': row.localeRows,
      Uyarı: row.warnings,
    })),
  );
  console.log(`Toplam ${sourceFilesRead} içerik dosyası içe aktarıldı.`);
}

main()
  .catch((error: unknown) => {
    console.error('İçerik içe aktarma başarısız:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
