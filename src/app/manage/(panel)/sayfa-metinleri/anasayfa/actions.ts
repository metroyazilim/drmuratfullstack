'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { HOME_SECTIONS, structuredFormDataToObject } from '@/lib/admin/structured-content';
import { homeSchema } from '@/lib/content/schemas';
import { prisma } from '@/lib/db';

export type HomeActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const localeSchema = z.literal('tr');
const siteName = 'Dr. Murat Irmak Kliniği';

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path && !errors[path]) errors[path] = issue.message;
  }
  return errors;
}

export async function saveHomeAction(
  _previousState: HomeActionState | null,
  formData: FormData,
): Promise<HomeActionState> {
  const session = await requireAdmin();
  const localeResult = localeSchema.safeParse(formData.get('locale'));
  if (!localeResult.success) return { ok: false, error: 'Geçerli bir dil seçin.' };

  const contentResult = homeSchema.safeParse(
    structuredFormDataToObject(formData, HOME_SECTIONS),
  );
  if (!contentResult.success) {
    return {
      ok: false,
      error: 'Kaydedilemeyen alanlar var. İşaretli alanları kontrol edin.',
      fieldErrors: fieldErrors(contentResult.error),
    };
  }
  if (contentResult.data.seo.title.length > 70) {
    return {
      ok: false,
      error: 'SEO başlığı en fazla 70 karakter olabilir.',
      fieldErrors: { 'seo.title': 'En fazla 70 karakter girin.' },
    };
  }
  if (
    !contentResult.data.seo.ogImage.startsWith('/images/og/') &&
    !/^https?:\/\//.test(contentResult.data.seo.ogImage)
  ) {
    return {
      ok: false,
      error: 'Sosyal paylaşım görseli geçersiz.',
      fieldErrors: {
        'seo.ogImage': 'Görsel /images/og/ ile başlamalı veya tam URL olmalıdır.',
      },
    };
  }
  const hasLongSearchTitle =
    `${contentResult.data.seo.title} | ${siteName}`.length > 60;

  try {
    const content = await prisma.homeContent.upsert({
      where: { locale: localeResult.data },
      create: { locale: localeResult.data, data: contentResult.data },
      update: { data: contentResult.data },
    });
    await recordAudit({
      action: 'home.update',
      entity: 'HomeContent',
      entityId: content.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${localeResult.data.toUpperCase()} anasayfa metinleri güncellendi`,
    });
    revalidatePath('/manage/sayfa-metinleri/anasayfa');
    revalidatePath('/', 'layout');
    return {
      ok: true,
      message: hasLongSearchTitle
        ? 'Kaydedildi. SEO başlığı site adıyla birlikte 60 karakteri aşıyor.'
        : 'Anasayfa metinleri kaydedildi.',
    };
  } catch (error) {
    console.error('Anasayfa metinleri kaydedilemedi.', error);
    return { ok: false, error: 'Anasayfa metinleri kaydedilemedi. Lütfen tekrar deneyin.' };
  }
}
