'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { ADMIN_LOCALES } from '@/lib/admin/locales';
import { faqListSchema } from '@/lib/content/schemas';
import type { FaqItem } from '@/lib/content/types';
import { prisma } from '@/lib/db';

export type FaqActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const keySchema = z
  .string()
  .trim()
  .min(2, 'Kayıt anahtarı en az 2 karakter olmalıdır.')
  .max(80, 'Kayıt anahtarı en fazla 80 karakter olabilir.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Kayıt anahtarında küçük harf, rakam ve tire kullanın.');
const idSchema = z.string().min(1, 'Kayıt bulunamadı.');
const directionSchema = z.enum(['up', 'down']);

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function parseLocalizedFaq(formData: FormData, key: string) {
  return faqListSchema.safeParse(
    ADMIN_LOCALES.map((locale) => {
      const category = formText(formData, `${locale}.category`);
      return {
        id: key,
        question: formText(formData, `${locale}.question`),
        answer: formText(formData, `${locale}.answer`),
        category: category || undefined,
      };
    }),
  );
}

function faqByLocale(items: readonly FaqItem[]): FaqItem | null {
  return items[0] ?? null;
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const itemIndex = typeof issue.path[0] === 'number' ? issue.path[0] : -1;
    const locale = ADMIN_LOCALES[itemIndex];
    const field = issue.path[1];
    const path = locale && typeof field === 'string' ? `${locale}.${field}` : 'form';
    if (!errors[path]) errors[path] = issue.message;
  }
  return errors;
}

function revalidateFaq(): void {
  revalidatePath('/manage/sayfa-metinleri/sss');
  revalidatePath('/', 'layout');
}

export async function createFaqAction(formData: FormData): Promise<FaqActionState> {
  const session = await requireAdmin();
  const keyResult = keySchema.safeParse(formData.get('key'));
  if (!keyResult.success) {
    return { ok: false, error: keyResult.error.issues[0]?.message ?? 'Kayıt anahtarı geçersiz.' };
  }
  const contentResult = parseLocalizedFaq(formData, keyResult.data);
  if (!contentResult.success) {
    return {
      ok: false,
      error: 'Soru ve cevap alanlarını kontrol edin.',
      fieldErrors: fieldErrors(contentResult.error),
    };
  }
  const localized = faqByLocale(contentResult.data);
  if (!localized) return { ok: false, error: 'Soru ve cevap alanları zorunludur.' };

  try {
    const highest = await prisma.faqEntry.aggregate({ _max: { order: true } });
    const entry = await prisma.faqEntry.create({
      data: {
        key: keyResult.data,
        order: (highest._max.order ?? -1) + 1,
        locales: {
          create: ADMIN_LOCALES.map((locale) => ({
            locale,
            question: localized.question,
            answer: localized.answer,
            category: localized.category,
          })),
        },
      },
    });
    await recordAudit({
      action: 'faq.create',
      entity: 'FaqEntry',
      entityId: entry.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `SSS kaydı eklendi: ${localized.question}`,
      metadata: { key: keyResult.data },
    });
    revalidateFaq();
    return { ok: true, message: 'Sık sorulan soru eklendi.' };
  } catch (error) {
    console.error('SSS kaydı eklenemedi.', error);
    return { ok: false, error: 'Kayıt eklenemedi. Anahtarın benzersiz olduğunu kontrol edin.' };
  }
}

export async function updateFaqAction(
  id: string,
  formData: FormData,
): Promise<FaqActionState> {
  const session = await requireAdmin();
  const identityResult = z
    .object({ id: idSchema, key: keySchema })
    .safeParse({ id, key: formData.get('key') });
  if (!identityResult.success) {
    return { ok: false, error: identityResult.error.issues[0]?.message ?? 'Kayıt geçersiz.' };
  }
  const contentResult = parseLocalizedFaq(formData, identityResult.data.key);
  if (!contentResult.success) {
    return {
      ok: false,
      error: 'Soru ve cevap alanlarını kontrol edin.',
      fieldErrors: fieldErrors(contentResult.error),
    };
  }
  const localized = faqByLocale(contentResult.data);
  if (!localized) return { ok: false, error: 'Soru ve cevap alanları zorunludur.' };

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.faqEntry.update({
        where: { id: identityResult.data.id },
        data: { key: identityResult.data.key },
      });
      await Promise.all(
        ADMIN_LOCALES.map((locale) =>
          transaction.faqLocale.upsert({
            where: { entryId_locale: { entryId: identityResult.data.id, locale } },
            create: {
              entryId: identityResult.data.id,
              locale,
              question: localized.question,
              answer: localized.answer,
              category: localized.category,
            },
            update: {
              question: localized.question,
              answer: localized.answer,
              category: localized.category,
            },
          }),
        ),
      );
    });
    await recordAudit({
      action: 'faq.update',
      entity: 'FaqEntry',
      entityId: identityResult.data.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `SSS kaydı güncellendi: ${localized.question}`,
      metadata: { key: identityResult.data.key },
    });
    revalidateFaq();
    return { ok: true, message: 'Sık sorulan soru güncellendi.' };
  } catch (error) {
    console.error('SSS kaydı güncellenemedi.', error);
    return { ok: false, error: 'Kayıt güncellenemedi. Lütfen tekrar deneyin.' };
  }
}

export async function deleteFaqAction(id: string): Promise<FaqActionState> {
  const session = await requireAdmin();
  const idResult = idSchema.safeParse(id);
  if (!idResult.success) return { ok: false, error: 'Silinecek kayıt bulunamadı.' };

  try {
    const entry = await prisma.faqEntry.delete({ where: { id: idResult.data } });
    await recordAudit({
      action: 'faq.delete',
      entity: 'FaqEntry',
      entityId: entry.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `SSS kaydı silindi: ${entry.key}`,
    });
    revalidateFaq();
    return { ok: true, message: 'Sık sorulan soru silindi.' };
  } catch (error) {
    console.error('SSS kaydı silinemedi.', error);
    return { ok: false, error: 'Kayıt silinemedi. Lütfen tekrar deneyin.' };
  }
}

export async function moveFaqAction(
  id: string,
  direction: 'up' | 'down',
): Promise<FaqActionState> {
  const session = await requireAdmin();
  const inputResult = z.object({ id: idSchema, direction: directionSchema }).safeParse({
    id,
    direction,
  });
  if (!inputResult.success) return { ok: false, error: 'Sıralama isteği geçersiz.' };

  try {
    const entries = await prisma.faqEntry.findMany({
      select: { id: true, order: true, key: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    const currentIndex = entries.findIndex((entry) => entry.id === inputResult.data.id);
    const targetIndex = currentIndex + (inputResult.data.direction === 'up' ? -1 : 1);
    const current = entries[currentIndex];
    const target = entries[targetIndex];
    if (!current || !target) return { ok: true, message: 'Kayıt zaten listenin sınırında.' };

    await prisma.$transaction([
      prisma.faqEntry.update({ where: { id: current.id }, data: { order: target.order } }),
      prisma.faqEntry.update({ where: { id: target.id }, data: { order: current.order } }),
    ]);
    await recordAudit({
      action: 'faq.reorder',
      entity: 'FaqEntry',
      entityId: current.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `SSS sırası değiştirildi: ${current.key}`,
      metadata: { direction: inputResult.data.direction },
    });
    revalidateFaq();
    return { ok: true, message: 'Sıralama güncellendi.' };
  } catch (error) {
    console.error('SSS sırası güncellenemedi.', error);
    return { ok: false, error: 'Sıralama güncellenemedi. Lütfen tekrar deneyin.' };
  }
}
