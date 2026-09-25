'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { recordAudit, requireAdmin } from '@/lib/admin-auth';
import {
  archiveMediaAsset,
  createMediaAsset,
  deleteMediaAsset,
  listMediaAssets,
  updateMediaAssetMetadata,
} from '@/lib/media/service';
import { MediaValidationError, validateUploadBuffer } from '@/lib/media/validation';
import type { MediaAssetDto } from '@/lib/media/types';

export type MediaActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type MediaUploadResult =
  | { ok: true; message: string; asset: MediaAssetDto }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type MediaPickerResult =
  | {
      ok: true;
      assets: MediaAssetDto[];
      total: number;
      page: number;
      pageSize: number;
    }
  | { ok: false; error: string };

const idSchema = z.string().trim().min(1);
const metadataSchema = z.object({
  altText: z.string().trim().max(500).transform((value) => value || null),
  caption: z.string().trim().max(2_000).transform((value) => value || null),
});
const pickerPageSchema = z.coerce.number().int().positive();

export async function uploadMediaAction(formData: FormData): Promise<MediaUploadResult> {
  const session = await requireAdmin();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Yüklenecek bir dosya seçin.' };
  }

  const metadata = metadataSchema.safeParse({
    altText: formData.get('altText'),
    caption: formData.get('caption'),
  });
  if (!metadata.success) {
    return { ok: false, error: 'Dosya bilgilerini kontrol edin.' };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const input = validateUploadBuffer(buffer, file.name);
    const asset = await createMediaAsset(
      prisma,
      input,
      { userId: session.id },
      {
        altText: metadata.data.altText ?? undefined,
        caption: metadata.data.caption ?? undefined,
      },
    );
    await recordAudit({
      action: 'media.upload',
      entity: 'MediaAsset',
      entityId: asset.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${asset.filename} yüklendi`,
      metadata: { kind: asset.kind, byteSize: asset.byteSize },
    });
    revalidatePath('/manage/medya');
    return { ok: true, message: 'Dosya yüklendi.', asset };
  } catch (error) {
    console.error('[manage/media] Dosya yüklenemedi.', error);
    return {
      ok: false,
      error:
        error instanceof MediaValidationError
          ? error.message
          : 'Dosya yüklenemedi. Lütfen tekrar deneyin.',
    };
  }
}

export async function listMediaForPickerAction(page: unknown): Promise<MediaPickerResult> {
  await requireAdmin();
  const parsedPage = pickerPageSchema.safeParse(page);
  if (!parsedPage.success) return { ok: false, error: 'Geçersiz sayfa numarası.' };

  try {
    const result = await listMediaAssets(prisma, {
      archived: false,
      kind: 'IMAGE',
      page: parsedPage.data,
      pageSize: 24,
    });
    return { ok: true, ...result };
  } catch (error) {
    console.error('[manage/media] Medya seçici listesi yüklenemedi.', error);
    return { ok: false, error: 'Medya kitaplığı yüklenemedi.' };
  }
}

export async function updateMediaMetadataAction(
  id: string,
  formData: FormData,
): Promise<MediaActionResult> {
  const session = await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  const metadata = metadataSchema.safeParse({
    altText: formData.get('altText'),
    caption: formData.get('caption'),
  });
  if (!parsedId.success || !metadata.success) {
    return { ok: false, error: 'Medya bilgilerini kontrol edin.' };
  }

  try {
    await updateMediaAssetMetadata(prisma, parsedId.data, metadata.data);
    await recordAudit({
      action: 'media.update',
      entity: 'MediaAsset',
      entityId: parsedId.data,
      actorId: session.id,
      actorEmail: session.email,
      summary: 'Medya açıklamaları güncellendi',
    });
    revalidatePath('/manage/medya');
    return { ok: true, message: 'Medya bilgileri kaydedildi.' };
  } catch (error) {
    console.error('[manage/media] Medya bilgileri kaydedilemedi.', error);
    return { ok: false, error: 'Medya bilgileri kaydedilemedi.' };
  }
}

export async function archiveMediaAssetAction(
  id: string,
  archived: boolean,
): Promise<MediaActionResult> {
  const session = await requireAdmin();
  const input = z.object({ id: idSchema, archived: z.boolean() }).safeParse({ id, archived });
  if (!input.success) return { ok: false, error: 'Geçersiz arşiv isteği.' };

  try {
    await archiveMediaAsset(prisma, input.data.id, input.data.archived);
    await recordAudit({
      action: input.data.archived ? 'media.archive' : 'media.restore',
      entity: 'MediaAsset',
      entityId: input.data.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: input.data.archived ? 'Medya arşivlendi' : 'Medya arşivden çıkarıldı',
    });
    revalidatePath('/manage/medya');
    return {
      ok: true,
      message: input.data.archived ? 'Medya arşivlendi.' : 'Medya arşivden çıkarıldı.',
    };
  } catch (error) {
    console.error('[manage/media] Arşiv durumu değiştirilemedi.', error);
    return { ok: false, error: 'Arşiv durumu değiştirilemedi.' };
  }
}

export async function deleteMediaAssetAction(id: string): Promise<MediaActionResult> {
  const session = await requireAdmin();
  const parsedId = idSchema.safeParse(id);
  if (!parsedId.success) return { ok: false, error: 'Geçersiz medya kaydı.' };

  try {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: parsedId.data },
      select: { archived: true, filename: true },
    });
    if (!asset) return { ok: false, error: 'Medya kaydı bulunamadı.' };
    if (!asset.archived) {
      return { ok: false, error: 'Kalıcı silmeden önce medyayı arşivleyin.' };
    }

    const deleted = await deleteMediaAsset(prisma, parsedId.data);
    if (!deleted) return { ok: false, error: 'Medya kaydı bulunamadı.' };

    await recordAudit({
      action: 'media.delete',
      entity: 'MediaAsset',
      entityId: parsedId.data,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${asset.filename} kalıcı olarak silindi`,
    });
    revalidatePath('/manage/medya');
    return { ok: true, message: 'Medya kalıcı olarak silindi.' };
  } catch (error) {
    console.error('[manage/media] Medya silinemedi.', error);
    return { ok: false, error: 'Medya silinemedi.' };
  }
}
