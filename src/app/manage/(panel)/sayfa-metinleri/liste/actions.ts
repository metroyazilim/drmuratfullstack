'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import {
  LISTING_LABELS,
  listingFieldsFor,
  structuredFormDataToObject,
} from '@/lib/admin/structured-content';
import { listingSchemas } from '@/lib/content/schemas';
import { prisma } from '@/lib/db';

export type ListingActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const localeSchema = z.literal('tr');
const listingKeySchema = z.enum([
  'services',
  'blog',
  'team',
  'faq',
  'appointment',
  'contact',
  'gallery',
]);

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path && !errors[path]) errors[path] = issue.message;
  }
  return errors;
}

export async function saveListingAction(
  _previousState: ListingActionState | null,
  formData: FormData,
): Promise<ListingActionState> {
  const session = await requireAdmin();
  const identityResult = z
    .object({
      key: listingKeySchema,
      locale: localeSchema,
    })
    .safeParse({
      key: formData.get('key'),
      locale: formData.get('locale'),
    });
  if (!identityResult.success) {
    return { ok: false, error: 'Geçerli bir sayfa ve dil seçin.' };
  }

  const { key, locale } = identityResult.data;
  const contentResult = listingSchemas[key].safeParse(
    structuredFormDataToObject(formData, listingFieldsFor(key)),
  );
  if (!contentResult.success) {
    return {
      ok: false,
      error: 'Kaydedilemeyen alanlar var. İşaretli alanları kontrol edin.',
      fieldErrors: fieldErrors(contentResult.error),
    };
  }

  try {
    const content = await prisma.listingContent.upsert({
      where: { key_locale: { key, locale } },
      create: { key, locale, data: contentResult.data },
      update: { data: contentResult.data },
    });
    await recordAudit({
      action: 'listing.update',
      entity: 'ListingContent',
      entityId: content.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${LISTING_LABELS[key]} sayfasının ${locale.toUpperCase()} metinleri güncellendi`,
      metadata: { key, locale },
    });
    revalidatePath('/manage/sayfa-metinleri/liste');
    revalidatePath(`/manage/sayfa-metinleri/liste/${key}`);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Liste sayfası metinleri kaydedildi.' };
  } catch (error) {
    console.error('Liste sayfası metinleri kaydedilemedi.', error);
    return {
      ok: false,
      error: 'Liste sayfası metinleri kaydedilemedi. Lütfen tekrar deneyin.',
    };
  }
}
