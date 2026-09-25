'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { seoFrontmatterSchema } from '@/lib/content/schemas';

export type SeoActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const quickSeoSchema = seoFrontmatterSchema
  .pick({
    title: true,
    description: true,
    ogImage: true,
    noindex: true,
  })
  .extend({
    localeId: z.string().trim().min(1, 'Dil kaydı bulunamadı.'),
  });

function fieldErrors(error: z.ZodError): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!entries[key]) entries[key] = issue.message;
  }
  return entries;
}

export async function saveQuickSeoAction(input: unknown): Promise<SeoActionResult> {
  const session = await requireAdmin();
  const parsed = quickSeoSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'SEO alanlarını kontrol edin.',
      fieldErrors: fieldErrors(parsed.error),
    };
  }

  try {
    const existing = await prisma.contentLocale.findUnique({
      where: { id: parsed.data.localeId },
      select: {
        id: true,
        locale: true,
        entryId: true,
        entry: { select: { type: true, key: true } },
      },
    });
    if (!existing) return { ok: false, error: 'Düzenlenecek dil kaydı bulunamadı.' };

    await prisma.contentLocale.update({
      where: { id: existing.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        ogImage: parsed.data.ogImage,
        noindex: parsed.data.noindex,
      },
    });
    await recordAudit({
      action: 'seo.update',
      entity: 'ContentLocale',
      entityId: existing.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${existing.entry.key} içeriğinin ${existing.locale.toUpperCase()} SEO alanları güncellendi.`,
      metadata: { entryId: existing.entryId, type: existing.entry.type, source: 'seo-workspace' },
    });
    revalidatePath('/manage/seo');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'SEO alanları kaydedildi.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'Düzenlenecek dil kaydı bulunamadı.' };
    }
    console.error('[manage/seo] Hızlı SEO kaydı başarısız:', error);
    return { ok: false, error: 'SEO alanları kaydedilemedi. Lütfen yeniden deneyin.' };
  }
}
