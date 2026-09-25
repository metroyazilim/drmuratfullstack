'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import { ADMIN_LOCALES } from '@/lib/admin/locales';
import { prisma } from '@/lib/db';

export type GalleryActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const idSchema = z.string().min(1, 'Görsel bulunamadı.');
const directionSchema = z.enum(['up', 'down']);
const imagePathSchema = z.string().refine(
  (value) => value.startsWith('/images/') || /^https?:\/\//.test(value),
  'Görsel yolu /images/ ile başlamalı veya tam bir URL olmalıdır.',
);
const altSchema = z.string().trim().min(10, 'Alternatif metin en az 10 karakter olmalıdır.');
const galleryInputSchema = z.object({
  path: imagePathSchema,
  alts: z.object({
    tr: altSchema,
    en: altSchema,
    ar: altSchema,
    ru: altSchema,
  }),
});
const galleryAltInputSchema = galleryInputSchema.pick({ alts: true });

function formText(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function galleryFormValue(formData: FormData) {
  return {
    path: formText(formData, 'path'),
    alts: {
      tr: formText(formData, 'tr.alt'),
      en: formText(formData, 'en.alt'),
      ar: formText(formData, 'ar.alt'),
      ru: formText(formData, 'ru.alt'),
    },
  };
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.').replace('alts.', '').replace(/\.alt$/, '');
    const fieldPath = path === 'path' ? 'path' : `${path}.alt`;
    if (!errors[fieldPath]) errors[fieldPath] = issue.message;
  }
  return errors;
}

function revalidateGallery(): void {
  revalidatePath('/manage/sayfa-metinleri/galeri');
  revalidatePath('/', 'layout');
}

export async function createGalleryImageAction(
  formData: FormData,
): Promise<GalleryActionState> {
  const session = await requireAdmin();
  const inputResult = galleryInputSchema.safeParse(galleryFormValue(formData));
  if (!inputResult.success) {
    return {
      ok: false,
      error: 'Görseli ve dört dildeki alternatif metinleri kontrol edin.',
      fieldErrors: fieldErrors(inputResult.error),
    };
  }

  try {
    const highest = await prisma.galleryImage.aggregate({ _max: { order: true } });
    const image = await prisma.galleryImage.create({
      data: {
        path: inputResult.data.path,
        order: (highest._max.order ?? -1) + 1,
        alts: {
          create: ADMIN_LOCALES.map((locale) => ({
            locale,
            alt: inputResult.data.alts[locale],
          })),
        },
      },
    });
    await recordAudit({
      action: 'gallery.create',
      entity: 'GalleryImage',
      entityId: image.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `Galeri görseli eklendi: ${image.path}`,
    });
    revalidateGallery();
    return { ok: true, message: 'Galeri görseli eklendi.' };
  } catch (error) {
    console.error('Galeri görseli eklenemedi.', error);
    return { ok: false, error: 'Görsel eklenemedi. Aynı görsel daha önce eklenmiş olabilir.' };
  }
}

export async function updateGalleryAltsAction(
  id: string,
  formData: FormData,
): Promise<GalleryActionState> {
  const session = await requireAdmin();
  const idResult = idSchema.safeParse(id);
  const inputResult = galleryAltInputSchema.safeParse(galleryFormValue(formData));
  if (!idResult.success) return { ok: false, error: 'Görsel bulunamadı.' };
  if (!inputResult.success) {
    return {
      ok: false,
      error: 'Dört dildeki alternatif metinleri kontrol edin.',
      fieldErrors: fieldErrors(inputResult.error),
    };
  }

  try {
    await prisma.$transaction(
      ADMIN_LOCALES.map((locale) =>
        prisma.galleryAlt.upsert({
          where: { imageId_locale: { imageId: idResult.data, locale } },
          create: { imageId: idResult.data, locale, alt: inputResult.data.alts[locale] },
          update: { alt: inputResult.data.alts[locale] },
        }),
      ),
    );
    const image = await prisma.galleryImage.findUniqueOrThrow({
      where: { id: idResult.data },
      select: { path: true },
    });
    await recordAudit({
      action: 'gallery.update',
      entity: 'GalleryImage',
      entityId: idResult.data,
      actorId: session.id,
      actorEmail: session.email,
      summary: `Galeri alternatif metinleri güncellendi: ${image.path}`,
    });
    revalidateGallery();
    return { ok: true, message: 'Alternatif metinler güncellendi.' };
  } catch (error) {
    console.error('Galeri alternatif metinleri güncellenemedi.', error);
    return { ok: false, error: 'Alternatif metinler güncellenemedi. Lütfen tekrar deneyin.' };
  }
}

export async function deleteGalleryImageAction(id: string): Promise<GalleryActionState> {
  const session = await requireAdmin();
  const idResult = idSchema.safeParse(id);
  if (!idResult.success) return { ok: false, error: 'Silinecek görsel bulunamadı.' };

  try {
    const image = await prisma.galleryImage.delete({ where: { id: idResult.data } });
    await recordAudit({
      action: 'gallery.delete',
      entity: 'GalleryImage',
      entityId: image.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `Galeri görseli silindi: ${image.path}`,
    });
    revalidateGallery();
    return { ok: true, message: 'Galeri görseli silindi.' };
  } catch (error) {
    console.error('Galeri görseli silinemedi.', error);
    return { ok: false, error: 'Görsel silinemedi. Lütfen tekrar deneyin.' };
  }
}

export async function moveGalleryImageAction(
  id: string,
  direction: 'up' | 'down',
): Promise<GalleryActionState> {
  const session = await requireAdmin();
  const inputResult = z.object({ id: idSchema, direction: directionSchema }).safeParse({
    id,
    direction,
  });
  if (!inputResult.success) return { ok: false, error: 'Sıralama isteği geçersiz.' };

  try {
    const images = await prisma.galleryImage.findMany({
      select: { id: true, order: true, path: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
    const currentIndex = images.findIndex((image) => image.id === inputResult.data.id);
    const targetIndex = currentIndex + (inputResult.data.direction === 'up' ? -1 : 1);
    const current = images[currentIndex];
    const target = images[targetIndex];
    if (!current || !target) return { ok: true, message: 'Görsel zaten listenin sınırında.' };

    await prisma.$transaction([
      prisma.galleryImage.update({ where: { id: current.id }, data: { order: target.order } }),
      prisma.galleryImage.update({ where: { id: target.id }, data: { order: current.order } }),
    ]);
    await recordAudit({
      action: 'gallery.reorder',
      entity: 'GalleryImage',
      entityId: current.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `Galeri sırası değiştirildi: ${current.path}`,
      metadata: { direction: inputResult.data.direction },
    });
    revalidateGallery();
    return { ok: true, message: 'Galeri sırası güncellendi.' };
  } catch (error) {
    console.error('Galeri sırası güncellenemedi.', error);
    return { ok: false, error: 'Sıralama güncellenemedi. Lütfen tekrar deneyin.' };
  }
}
