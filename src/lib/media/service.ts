import "server-only";
import type { PrismaClient } from "@prisma/client";
import { getStorageProvider } from "./storage";
import type { MediaAssetDto, ValidatedMediaInput } from "./types";

function generateObjectKey(sanitizedFilename: string): string {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `uploads/${stamp}-${random}-${sanitizedFilename}`;
}

type MediaAssetRow = {
  id: string;
  filename: string;
  objectKey: string;
  url: string;
  mimeType: string;
  extension: string;
  kind: "IMAGE" | "DOCUMENT";
  byteSize: number;
  checksum: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toMediaAssetDto(row: MediaAssetRow): MediaAssetDto {
  return { ...row };
}

/** Uploads a validated file to the configured storage provider and creates
 * its `MediaAsset` row. The two steps are sequential, not transactional: if
 * the row write fails after a successful upload, the object is orphaned in
 * storage rather than the row pointing at bytes that were never written —
 * the safer failure direction for a media library. */
export async function createMediaAsset(
  prisma: PrismaClient,
  input: ValidatedMediaInput,
  context: { userId: string },
  options?: { altText?: string; caption?: string },
): Promise<MediaAssetDto> {
  const storage = getStorageProvider();
  const objectKey = generateObjectKey(input.filename);
  const uploadResult = await storage.upload({ objectKey, buffer: input.buffer, mimeType: input.mimeType });

  const row = await prisma.mediaAsset.create({
    data: {
      filename: input.filename,
      objectKey: uploadResult.objectKey,
      url: uploadResult.url,
      mimeType: input.mimeType,
      extension: input.extension,
      kind: input.kind,
      byteSize: input.byteSize,
      checksum: input.checksum,
      width: input.width,
      height: input.height,
      altText: options?.altText ?? null,
      caption: options?.caption ?? null,
      uploadedById: context.userId,
    },
  });

  return toMediaAssetDto(row);
}

export async function listMediaAssets(
  prisma: PrismaClient,
  filter?: { archived?: boolean; kind?: "IMAGE" | "DOCUMENT"; page?: number; pageSize?: number },
): Promise<{ assets: MediaAssetDto[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filter?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filter?.pageSize ?? 40));
  const where = { archived: filter?.archived ?? false, ...(filter?.kind ? { kind: filter.kind } : {}) };

  const [rows, total] = await Promise.all([
    prisma.mediaAsset.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.mediaAsset.count({ where }),
  ]);

  return { assets: rows.map(toMediaAssetDto), total, page, pageSize };
}

export async function updateMediaAssetMetadata(
  prisma: PrismaClient,
  id: string,
  metadata: { altText?: string | null; caption?: string | null },
): Promise<MediaAssetDto> {
  const row = await prisma.mediaAsset.update({ where: { id }, data: metadata });
  return toMediaAssetDto(row);
}

export async function archiveMediaAsset(prisma: PrismaClient, id: string, archived: boolean): Promise<MediaAssetDto> {
  const row = await prisma.mediaAsset.update({ where: { id }, data: { archived } });
  return toMediaAssetDto(row);
}

/** Hard delete: removes the storage object and the row. Called only on an
 * already-archived asset from the admin UI, so an accidental click cannot
 * remove a live reference in one step. */
export async function deleteMediaAsset(prisma: PrismaClient, id: string): Promise<boolean> {
  const row = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!row) return false;
  await getStorageProvider().delete(row.objectKey);
  await prisma.mediaAsset.delete({ where: { id } });
  return true;
}
