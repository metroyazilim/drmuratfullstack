'use server';

import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { legacyRedirects } from '@/lib/seo/legacy-redirects';

export type RedirectActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const sourceSchema = z
  .string()
  .trim()
  .min(1, 'Kaynak adres zorunludur.')
  .startsWith('/', "Kaynak adres '/' ile başlamalıdır.")
  .refine((value) => !value.startsWith('/manage'), "Kaynak adres '/manage' ile başlayamaz.")
  .refine((value) => !/\s/.test(value), 'Kaynak adres boşluk içeremez.');

const destinationSchema = z
  .string()
  .trim()
  .min(1, 'Hedef adres zorunludur.')
  .refine(
    (value) =>
      (value.startsWith('/') && !value.startsWith('//') && !/\s/.test(value)) ||
      /^https?:\/\/[^\s]+$/i.test(value),
    "Hedef, '/' ile başlayan site içi bir yol veya tam bir http(s) adresi olmalıdır.",
  );

const redirectSchema = z
  .object({
    id: z.string().trim().optional(),
    source: sourceSchema,
    destination: destinationSchema,
    permanent: z.boolean(),
    isActive: z.boolean(),
    note: z.string().trim().max(500, 'Not en fazla 500 karakter olabilir.'),
  })
  .refine((value) => value.source !== value.destination, {
    message: 'Kaynak ve hedef adres aynı olamaz.',
    path: ['destination'],
  });

const idSchema = z.object({ id: z.string().trim().min(1, 'Yönlendirme bulunamadı.') });

function parseForm(formData: FormData) {
  return redirectSchema.safeParse({
    id: formData.get('id'),
    source: formData.get('source'),
    destination: formData.get('destination'),
    permanent: formData.get('permanent') === 'on',
    isActive: formData.get('isActive') === 'on',
    note: formData.get('note'),
  });
}
const importSchema = z.object({ confirm: z.literal('legacy') });

function validationFailure(error: z.ZodError): RedirectActionResult {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    if (!errors[field]) errors[field] = issue.message;
  }
  return {
    ok: false,
    error: error.issues[0]?.message ?? 'Yönlendirme alanlarını kontrol edin.',
    fieldErrors: errors,
  };
}

async function chainWarning(destination: string, ignoredId?: string): Promise<string | null> {
  if (!destination.startsWith('/')) return null;
  const next = await prisma.redirect.findFirst({
    where: {
      source: destination,
      isActive: true,
      ...(ignoredId ? { id: { not: ignoredId } } : {}),
    },
    select: { destination: true },
  });
  return next
    ? `Uyarı: Hedef başka bir yönlendirmenin kaynağı; ${destination} → ${next.destination} zinciri oluşuyor.`
    : null;
}

export async function createRedirectAction(
  _previous: RedirectActionResult,
  formData: FormData,
): Promise<RedirectActionResult> {
  const session = await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const warning = await chainWarning(parsed.data.destination);
    const created = await prisma.redirect.create({
      data: {
        source: parsed.data.source,
        destination: parsed.data.destination,
        permanent: parsed.data.permanent,
        isActive: parsed.data.isActive,
        note: parsed.data.note || null,
      },
      select: { id: true },
    });
    await recordAudit({
      action: 'create',
      entity: 'Redirect',
      entityId: created.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${parsed.data.source} yönlendirmesi eklendi.`,
    });
    revalidatePath('/manage/yonlendirmeler');
    revalidatePath('/', 'layout');
    return {
      ok: true,
      message: warning ? `Yönlendirme eklendi. ${warning}` : 'Yönlendirme eklendi.',
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Bu kaynak adres için zaten bir yönlendirme var.' };
    }
    console.error('[manage/yonlendirmeler] Ekleme başarısız:', error);
    return { ok: false, error: 'Yönlendirme eklenemedi. Lütfen yeniden deneyin.' };
  }
}

export async function updateRedirectAction(
  _previous: RedirectActionResult,
  formData: FormData,
): Promise<RedirectActionResult> {
  const session = await requireAdmin();
  const parsed = parseForm(formData);
  if (!parsed.success) return validationFailure(parsed.error);
  if (!parsed.data.id) return { ok: false, error: 'Yönlendirme bulunamadı.' };

  try {
    const warning = await chainWarning(parsed.data.destination, parsed.data.id);
    await prisma.redirect.update({
      where: { id: parsed.data.id },
      data: {
        source: parsed.data.source,
        destination: parsed.data.destination,
        permanent: parsed.data.permanent,
        isActive: parsed.data.isActive,
        note: parsed.data.note || null,
      },
    });
    await recordAudit({
      action: 'update',
      entity: 'Redirect',
      entityId: parsed.data.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${parsed.data.source} yönlendirmesi güncellendi.`,
    });
    revalidatePath('/manage/yonlendirmeler');
    revalidatePath('/', 'layout');
    return {
      ok: true,
      message: warning ? `Yönlendirme güncellendi. ${warning}` : 'Yönlendirme güncellendi.',
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Bu kaynak adres başka bir kayıtta kullanılıyor.' };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'Yönlendirme bulunamadı.' };
    }
    console.error('[manage/yonlendirmeler] Güncelleme başarısız:', error);
    return { ok: false, error: 'Yönlendirme güncellenemedi. Lütfen yeniden deneyin.' };
  }
}

export async function deleteRedirectAction(
  _previous: RedirectActionResult,
  formData: FormData,
): Promise<RedirectActionResult> {
  const session = await requireAdmin();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'Yönlendirme bulunamadı.' };

  try {
    const deleted = await prisma.redirect.delete({
      where: { id: parsed.data.id },
      select: { source: true },
    });
    await recordAudit({
      action: 'delete',
      entity: 'Redirect',
      entityId: parsed.data.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${deleted.source} yönlendirmesi silindi.`,
    });
    revalidatePath('/manage/yonlendirmeler');
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Yönlendirme silindi.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { ok: false, error: 'Yönlendirme zaten silinmiş.' };
    }
    console.error('[manage/yonlendirmeler] Silme başarısız:', error);
    return { ok: false, error: 'Yönlendirme silinemedi. Lütfen yeniden deneyin.' };
  }
}

export async function importLegacyRedirectsAction(
  _previous: RedirectActionResult,
  formData: FormData,
): Promise<RedirectActionResult> {
  const session = await requireAdmin();
  const parsed = importSchema.safeParse({ confirm: formData.get('confirm') });
  if (!parsed.success) return { ok: false, error: 'İçe aktarma isteği geçersiz.' };
  try {
    const result = await prisma.redirect.createMany({
      data: legacyRedirects.map((entry) => ({
        source: entry.source,
        destination: entry.destination,
        permanent: true,
        isActive: true,
        note: 'Kod içindeki eski site yönlendirmesinden içe aktarıldı.',
      })),
      skipDuplicates: true,
    });
    await recordAudit({
      action: 'import',
      entity: 'Redirect',
      actorId: session.id,
      actorEmail: session.email,
      summary: `${result.count} kod yönlendirmesi içe aktarıldı.`,
      metadata: { importedCount: result.count },
    });
    revalidatePath('/manage/yonlendirmeler');
    revalidatePath('/', 'layout');
    return {
      ok: true,
      message:
        result.count > 0
          ? `${result.count} yönlendirme içe aktarıldı.`
          : 'Kod içindeki yönlendirmelerin tamamı zaten kayıtlı.',
    };
  } catch (error) {
    console.error('[manage/yonlendirmeler] İçe aktarma başarısız:', error);
    return { ok: false, error: 'Kod yönlendirmeleri içe aktarılamadı.' };
  }
}
