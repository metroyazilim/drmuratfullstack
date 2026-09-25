'use server';

import { ContentStatus, ContentType, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin, recordAudit } from '@/lib/admin-auth';
import { CONTENT_TYPES, mergeFrontmatter, splitFrontmatter } from '@/lib/admin/content-model';
import { describeCompleteness, validateLocaleInput } from '@/lib/admin/content-validation';
import { LOCALE_LABELS, isAdminLocale } from '@/lib/admin/locales';
import { prisma } from '@/lib/db';

export type ContentActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const INITIAL_RESULT: ContentActionResult = { ok: true };

const entryIdentitySchema = z.object({
  entryId: z.string().cuid('Geçersiz içerik kaydı.'),
  type: z.nativeEnum(ContentType),
});

const localeIdentitySchema = entryIdentitySchema.extend({
  locale: z.string().refine(isAdminLocale, 'Geçersiz dil.'),
});

const createEntrySchema = z.object({
  type: z.nativeEnum(ContentType),
  key: z
    .string()
    .trim()
    .min(1, 'Anahtar zorunludur.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Yalnız küçük harf, rakam ve tire kullanın.'),
});

const saveLocaleIdentitySchema = localeIdentitySchema.extend({
  body: z.string(),
});

const statusSchema = entryIdentitySchema.extend({
  status: z.nativeEnum(ContentStatus),
});

const reorderSchema = z.object({
  type: z.nativeEnum(ContentType),
  orderedIds: z
    .string()
    .transform((value, context) => {
      try {
        const parsed: unknown = JSON.parse(value);
        return parsed;
      } catch {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Sıralama verisi geçersiz.' });
        return z.NEVER;
      }
    })
    .pipe(z.array(z.string().cuid()).min(1)),
});

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function readJson(formData: FormData, name: string): unknown {
  const value = formData.get(name);
  if (typeof value !== 'string') return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed;
  } catch {
    return null;
  }
}

function readOptionalString(formData: FormData, name: string): string | undefined {
  const value = readString(formData, name);
  return value || undefined;
}

function normalizeIsoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00.000Z`;
  return value;
}

function buildFrontmatter(
  type: ContentType,
  formData: FormData,
  immutablePublishedAt?: string,
): Record<string, unknown> {
  const frontmatter: Record<string, unknown> = {
    title: readString(formData, 'title'),
    description: readString(formData, 'description'),
    slug: readString(formData, 'slug'),
    primaryKeyword: readString(formData, 'primaryKeyword'),
    secondaryKeywords: readJson(formData, 'secondaryKeywords'),
    ogImage: readString(formData, 'ogImage'),
    heroImage: readString(formData, 'heroImage'),
    heroImageAlt: readString(formData, 'heroImageAlt'),
    noindex: formData.get('noindex') === 'on',
  };

  if (type === ContentType.SERVICE) {
    return {
      ...frontmatter,
      shortDescription: readString(formData, 'shortDescription'),
      cardImage: readString(formData, 'cardImage'),
      cardImageAlt: readString(formData, 'cardImageAlt'),
      order: Number(readString(formData, 'order')),
      relatedPosts: formData.getAll('relatedPosts').filter((value): value is string => typeof value === 'string'),
      kpis: readJson(formData, 'kpis'),
      blocks: readJson(formData, 'blocks'),
    };
  }

  if (type === ContentType.POST) {
    return {
      ...frontmatter,
      publishedAt:
        immutablePublishedAt ?? normalizeIsoDate(readString(formData, 'publishedAt')),
      updatedAt: new Date().toISOString(),
      category: readString(formData, 'category'),
      author: readString(formData, 'author') || 'Dr. Murat Irmak',
      relatedServices: formData
        .getAll('relatedServices')
        .filter((value): value is string => typeof value === 'string'),
      blocks: readJson(formData, 'blocks'),
    };
  }

  if (type === ContentType.TEAM) {
    return {
      ...frontmatter,
      name: readString(formData, 'name'),
      role: readString(formData, 'role'),
      photo: readOptionalString(formData, 'photo'),
      photoAlt: readOptionalString(formData, 'photoAlt'),
      duties: readJson(formData, 'duties'),
      order: Number(readString(formData, 'order')),
    };
  }

  if (type === ContentType.PAGE) {
    return {
      ...frontmatter,
      sidebarImage: readOptionalString(formData, 'sidebarImage'),
      sidebarImageAlt: readOptionalString(formData, 'sidebarImageAlt'),
      approach: readJson(formData, 'approach') || undefined,
      timeline: readJson(formData, 'timeline') || undefined,
      ctaLabel: readOptionalString(formData, 'ctaLabel'),
    };
  }

  return frontmatter;
}

function toJsonValue(input: unknown): Prisma.InputJsonValue {
  if (typeof input === 'string' || typeof input === 'number' || typeof input === 'boolean') {
    return input;
  }
  if (Array.isArray(input)) return input.map(toJsonValue);
  if (input && typeof input === 'object') {
    const entries: Array<[string, Prisma.InputJsonValue | null]> = [];
    for (const [key, value] of Object.entries(input)) {
      if (value === undefined) continue;
      entries.push([key, value === null ? null : toJsonValue(value)]);
    }
    return Object.fromEntries(entries);
  }
  throw new Error('JSON alanı desteklenmeyen bir değer içeriyor.');
}

function refreshContentRoutes(): void {
  revalidatePath('/', 'layout');
  revalidatePath('/manage/icerik', 'layout');
}

function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.map(String).join('.') || 'form';
    fieldErrors[path] ??= issue.message;
  }
  return fieldErrors;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function createEntryAction(
  _previousState: ContentActionResult = INITIAL_RESULT,
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await requireAdmin();
  const parsed = createEntrySchema.safeParse({
    type: formData.get('type'),
    key: formData.get('key'),
  });
  if (!parsed.success) {
    return { ok: false, error: 'İçerik oluşturulamadı.', fieldErrors: zodFieldErrors(parsed.error) };
  }
  if (!CONTENT_TYPES[parsed.data.type].canCreate) {
    return { ok: false, error: 'Bu içerik tipinde yeni kayıt oluşturulamaz.' };
  }

  try {
    const lastEntry = CONTENT_TYPES[parsed.data.type].hasOrder
      ? await prisma.contentEntry.findFirst({
          where: { type: parsed.data.type },
          orderBy: { order: 'desc' },
          select: { order: true },
        })
      : null;
    const entry = await prisma.contentEntry.create({
      data: {
        type: parsed.data.type,
        key: parsed.data.key,
        order: lastEntry ? lastEntry.order + 1 : 0,
      },
    });
    await recordAudit({
      action: 'CREATE',
      entity: 'ContentEntry',
      entityId: entry.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${CONTENT_TYPES[parsed.data.type].singular} oluşturuldu: ${entry.key}`,
      metadata: { type: parsed.data.type, key: entry.key },
    });
    refreshContentRoutes();
    return { ok: true, message: 'Kayıt oluşturuldu. Listeden açarak dilleri ekleyebilirsiniz.' };
  } catch (error: unknown) {
    console.error('İçerik oluşturulamadı.', error);
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        error: 'Bu anahtar daha önce kullanılmış.',
        fieldErrors: { key: 'Bu anahtar aynı içerik tipinde zaten kullanılıyor.' },
      };
    }
    return { ok: false, error: 'İçerik oluşturulurken beklenmeyen bir hata oluştu.' };
  }
}

export async function saveLocaleAction(
  _previousState: ContentActionResult = INITIAL_RESULT,
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await requireAdmin();
  const identity = saveLocaleIdentitySchema.safeParse({
    entryId: formData.get('entryId'),
    type: formData.get('type'),
    locale: formData.get('locale'),
    body: formData.get('body'),
  });
  if (!identity.success) {
    return { ok: false, error: 'Dil içeriği kaydedilemedi.', fieldErrors: zodFieldErrors(identity.error) };
  }

  try {
    const entry = await prisma.contentEntry.findFirst({
      where: { id: identity.data.entryId, type: identity.data.type },
      include: { locales: { where: { locale: identity.data.locale }, take: 1 } },
    });
    if (!entry) return { ok: false, error: 'İçerik kaydı bulunamadı.' };

    const existingLocale = entry.locales[0];
    const existingData = existingLocale
      ? mergeFrontmatter(existingLocale)
      : null;
    const immutablePublishedAt =
      identity.data.type === ContentType.POST &&
      existingData &&
      typeof existingData.publishedAt === 'string'
        ? existingData.publishedAt
        : undefined;
    const input = buildFrontmatter(identity.data.type, formData, immutablePublishedAt);
    const validation = validateLocaleInput(identity.data.type, identity.data.locale, input);
    if (!validation.ok) {
      return {
        ok: false,
        error: 'Alanları kontrol edip yeniden deneyin.',
        fieldErrors: validation.fieldErrors,
      };
    }

    const split = splitFrontmatter(validation.frontmatter);
    const conflictingSlug = await prisma.contentLocale.findFirst({
      where: {
        type: identity.data.type,
        locale: identity.data.locale,
        slug: split.base.slug,
        entryId: { not: identity.data.entryId },
      },
      select: { slug: true },
    });
    if (conflictingSlug) {
      return {
        ok: false,
        error: 'Slug çakışması var.',
        fieldErrors: {
          slug: `Bu slug aynı dilde başka bir kayıtta kullanılıyor: ${conflictingSlug.slug}`,
        },
      };
    }

    const conflictingKeyword = await prisma.contentLocale.findFirst({
      where: {
        type: identity.data.type,
        locale: identity.data.locale,
        primaryKeyword: { equals: split.base.primaryKeyword, mode: 'insensitive' },
        entryId: { not: identity.data.entryId },
      },
      select: { primaryKeyword: true },
    });
    if (conflictingKeyword) {
      return {
        ok: false,
        error: 'Birincil anahtar kelime çakışması var.',
        fieldErrors: {
          primaryKeyword: `Bu birincil anahtar kelime aynı dilde başka bir kayıtta kullanılıyor: ${conflictingKeyword.primaryKeyword}`,
        },
      };
    }

    const data = {
      type: identity.data.type,
      slug: split.base.slug,
      title: split.base.title,
      description: split.base.description,
      primaryKeyword: split.base.primaryKeyword,
      secondaryKeywords: split.base.secondaryKeywords,
      ogImage: split.base.ogImage,
      heroImage: split.base.heroImage,
      heroImageAlt: split.base.heroImageAlt,
      noindex: split.base.noindex,
      body: identity.data.body,
      data: toJsonValue(split.data),
    };
    const orderValue = split.data.order;

    await prisma.$transaction([
      prisma.contentLocale.upsert({
        where: {
          entryId_locale: { entryId: identity.data.entryId, locale: identity.data.locale },
        },
        create: {
          entryId: identity.data.entryId,
          locale: identity.data.locale,
          ...data,
        },
        update: data,
      }),
      ...(CONTENT_TYPES[identity.data.type].hasOrder && typeof orderValue === 'number'
        ? [
            prisma.contentEntry.update({
              where: { id: identity.data.entryId },
              data: { order: orderValue },
            }),
          ]
        : []),
    ]);
    await recordAudit({
      action: existingLocale ? 'UPDATE_LOCALE' : 'CREATE_LOCALE',
      entity: 'ContentEntry',
      entityId: identity.data.entryId,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${LOCALE_LABELS[identity.data.locale]} içerik kaydedildi: ${split.base.title}`,
      metadata: { type: identity.data.type, locale: identity.data.locale },
    });
    refreshContentRoutes();
    return { ok: true, message: `${LOCALE_LABELS[identity.data.locale]} içerik kaydedildi.` };
  } catch (error: unknown) {
    console.error('Dil içeriği kaydedilemedi.', error);
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        error: 'Slug çakışması var.',
        fieldErrors: { slug: 'Bu slug aynı dilde başka bir kayıtta kullanılıyor.' },
      };
    }
    return { ok: false, error: 'İçerik kaydedilirken beklenmeyen bir hata oluştu.' };
  }
}

export async function setStatusAction(
  _previousState: ContentActionResult = INITIAL_RESULT,
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await requireAdmin();
  const parsed = statusSchema.safeParse({
    entryId: formData.get('entryId'),
    type: formData.get('type'),
    status: formData.get('status'),
  });
  if (!parsed.success) return { ok: false, error: 'Durum bilgisi geçersiz.' };

  try {
    const entry = await prisma.contentEntry.findFirst({
      where: { id: parsed.data.entryId, type: parsed.data.type },
      include: { locales: true },
    });
    if (!entry) return { ok: false, error: 'İçerik kaydı bulunamadı.' };

    if (parsed.data.status === ContentStatus.PUBLISHED) {
      const completeness = describeCompleteness(entry);
      if (!completeness.complete) {
        const labels = completeness.missing.map((locale) => LOCALE_LABELS[locale]).join(', ');
        return {
          ok: false,
          error: `Yayınlamak için Türkçe içeriğin tamamlanması gerekir. Eksik veya geçersiz: ${labels}.`,
        };
      }
    }

    await prisma.contentEntry.update({
      where: { id: entry.id },
      data: {
        status: parsed.data.status,
        publishedAt:
          parsed.data.status === ContentStatus.PUBLISHED
            ? entry.publishedAt ?? new Date()
            : entry.publishedAt,
      },
    });
    await recordAudit({
      action: 'SET_STATUS',
      entity: 'ContentEntry',
      entityId: entry.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${entry.key} durumu ${parsed.data.status} olarak değiştirildi.`,
      metadata: { previousStatus: entry.status, status: parsed.data.status },
    });
    refreshContentRoutes();
    return { ok: true, message: 'İçerik durumu güncellendi.' };
  } catch (error: unknown) {
    console.error('İçerik durumu güncellenemedi.', error);
    return { ok: false, error: 'İçerik durumu güncellenirken beklenmeyen bir hata oluştu.' };
  }
}

export async function reorderAction(
  _previousState: ContentActionResult = INITIAL_RESULT,
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await requireAdmin();
  const parsed = reorderSchema.safeParse({
    type: formData.get('type'),
    orderedIds: formData.get('orderedIds'),
  });
  if (!parsed.success) return { ok: false, error: 'Sıralama bilgisi geçersiz.' };
  if (!CONTENT_TYPES[parsed.data.type].hasOrder) {
    return { ok: false, error: 'Bu içerik tipi sıralanamaz.' };
  }

  try {
    const existingCount = await prisma.contentEntry.count({
      where: { type: parsed.data.type, id: { in: parsed.data.orderedIds } },
    });
    if (existingCount !== parsed.data.orderedIds.length) {
      return { ok: false, error: 'Sıralama listesinde geçersiz kayıt var.' };
    }
    await prisma.$transaction(
      parsed.data.orderedIds.map((id, index) =>
        prisma.contentEntry.update({ where: { id }, data: { order: index + 1 } }),
      ),
    );
    await recordAudit({
      action: 'REORDER',
      entity: 'ContentEntry',
      actorId: session.id,
      actorEmail: session.email,
      summary: `${CONTENT_TYPES[parsed.data.type].label} sıralaması güncellendi.`,
      metadata: { type: parsed.data.type, orderedIds: parsed.data.orderedIds },
    });
    refreshContentRoutes();
    return { ok: true, message: 'Sıralama güncellendi.' };
  } catch (error: unknown) {
    console.error('İçerik sıralanamadı.', error);
    return { ok: false, error: 'Sıralama güncellenirken beklenmeyen bir hata oluştu.' };
  }
}

export async function deleteEntryAction(
  _previousState: ContentActionResult = INITIAL_RESULT,
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await requireAdmin();
  const parsed = entryIdentitySchema.safeParse({
    entryId: formData.get('entryId'),
    type: formData.get('type'),
  });
  if (!parsed.success) return { ok: false, error: 'İçerik kaydı geçersiz.' };

  try {
    const entry = await prisma.contentEntry.findFirst({
      where: { id: parsed.data.entryId, type: parsed.data.type },
    });
    if (!entry) return { ok: false, error: 'İçerik kaydı bulunamadı.' };
    if (entry.status !== ContentStatus.ARCHIVED) {
      return { ok: false, error: 'Kalıcı silme yalnızca arşivlenmiş kayıtlarda kullanılabilir.' };
    }
    await prisma.contentEntry.delete({ where: { id: entry.id } });
    await recordAudit({
      action: 'DELETE',
      entity: 'ContentEntry',
      entityId: entry.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${CONTENT_TYPES[entry.type].singular} kalıcı olarak silindi: ${entry.key}`,
      metadata: { type: entry.type, key: entry.key },
    });
    refreshContentRoutes();
    return { ok: true, message: 'İçerik kalıcı olarak silindi.' };
  } catch (error: unknown) {
    console.error('İçerik silinemedi.', error);
    return { ok: false, error: 'İçerik silinirken beklenmeyen bir hata oluştu.' };
  }
}

export async function deleteLocaleAction(
  _previousState: ContentActionResult = INITIAL_RESULT,
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await requireAdmin();
  const parsed = localeIdentitySchema.safeParse({
    entryId: formData.get('entryId'),
    type: formData.get('type'),
    locale: formData.get('locale'),
  });
  if (!parsed.success) return { ok: false, error: 'Dil kaydı geçersiz.' };

  try {
    const deleted = await prisma.contentLocale.deleteMany({
      where: {
        entryId: parsed.data.entryId,
        type: parsed.data.type,
        locale: parsed.data.locale,
      },
    });
    if (deleted.count === 0) return { ok: false, error: 'Silinecek dil içeriği bulunamadı.' };
    await recordAudit({
      action: 'DELETE_LOCALE',
      entity: 'ContentEntry',
      entityId: parsed.data.entryId,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${LOCALE_LABELS[parsed.data.locale]} içerik silindi.`,
      metadata: { type: parsed.data.type, locale: parsed.data.locale },
    });
    refreshContentRoutes();
    return { ok: true, message: `${LOCALE_LABELS[parsed.data.locale]} içerik silindi.` };
  } catch (error: unknown) {
    console.error('Dil içeriği silinemedi.', error);
    return { ok: false, error: 'Dil içeriği silinirken beklenmeyen bir hata oluştu.' };
  }
}
