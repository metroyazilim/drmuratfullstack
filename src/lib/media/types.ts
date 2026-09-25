export type MediaMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/svg+xml" | "application/pdf";

export type MediaExtension = ".jpg" | ".jpeg" | ".png" | ".webp" | ".gif" | ".svg" | ".pdf";

export type MediaKind = "IMAGE" | "DOCUMENT";

export type ValidatedMediaInput = Readonly<{
  buffer: Buffer;
  filename: string;
  mimeType: MediaMimeType;
  extension: MediaExtension;
  kind: MediaKind;
  byteSize: number;
  checksum: string;
  width: number | null;
  height: number | null;
}>;

export type MediaAssetDto = Readonly<{
  id: string;
  filename: string;
  objectKey: string;
  url: string;
  mimeType: string;
  extension: string;
  kind: MediaKind;
  byteSize: number;
  checksum: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export type StorageConfig = Readonly<{
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucketName: string;
  publicBaseUrl: string;
  isConfigured: boolean;
}>;

export type StorageUploadResult = Readonly<{ objectKey: string; url: string }>;

export interface StorageProvider {
  getPublicUrl(objectKey: string): string;
  upload(input: { objectKey: string; buffer: Buffer; mimeType: string }): Promise<StorageUploadResult>;
  delete(objectKey: string): Promise<boolean>;
}
