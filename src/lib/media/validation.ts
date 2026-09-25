import { createHash } from "node:crypto";
import type { MediaExtension, MediaKind, MediaMimeType, ValidatedMediaInput } from "./types";

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_SVG_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const MIME_EXTENSION_MAP: Readonly<Record<MediaMimeType, readonly MediaExtension[]>> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
};

const KIND_BY_MIME: Readonly<Record<MediaMimeType, MediaKind>> = {
  "image/jpeg": "IMAGE",
  "image/png": "IMAGE",
  "image/webp": "IMAGE",
  "image/gif": "IMAGE",
  "image/svg+xml": "IMAGE",
  "application/pdf": "DOCUMENT",
};

export class MediaValidationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "MediaValidationError";
    this.code = code;
  }
}

/** Strips path separators, control characters, and anything but the
 * conservative filename charset, so a stored `filename` can never be used
 * for path traversal or header/HTML injection. */
export function sanitizeFilename(rawName: string): string {
  const base = rawName.split(/[/\\]/).pop() ?? "upload";
  const stripped = base.replace(/[\u0000-\u001f\u007f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
  const trimmed = stripped.replace(/^-+|-+$/g, "").slice(0, 180);
  return trimmed.length > 0 ? trimmed : "upload";
}

const MAGIC_BYTES: ReadonlyArray<{ mime: MediaMimeType; matches: (buffer: Buffer) => boolean }> = [
  { mime: "image/png", matches: (b) => b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { mime: "image/jpeg", matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/gif", matches: (b) => b.length >= 6 && b.subarray(0, 3).toString("ascii") === "GIF" },
  { mime: "image/webp", matches: (b) => b.length >= 12 && b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  { mime: "application/pdf", matches: (b) => b.length >= 5 && b.subarray(0, 5).toString("ascii") === "%PDF-" },
];

/** Detects the real content type from file magic bytes — the claimed
 * `Content-Type` from the request is never trusted on its own. SVG is
 * text, not magic bytes, and is verified separately below. */
export function detectMagicBytes(buffer: Buffer): MediaMimeType | null {
  const hit = MAGIC_BYTES.find((entry) => entry.matches(buffer));
  return hit?.mime ?? null;
}

const SVG_DANGEROUS_PATTERN = /<script[\s>]|on\w+\s*=|<foreignObject|javascript:/i;

/** Rejects SVGs carrying `<script>`, event-handler attributes, embedded
 * `<foreignObject>`, or a `javascript:` URI — the common XSS vectors when an
 * SVG is served inline or referenced directly by the browser. */
export function validateSvgSecurity(svgText: string): void {
  if (!svgText.trimStart().startsWith("<")) {
    throw new MediaValidationError("Geçersiz SVG içeriği.", "invalid_svg");
  }
  if (SVG_DANGEROUS_PATTERN.test(svgText)) {
    throw new MediaValidationError("SVG dosyası güvenlik nedeniyle reddedildi.", "unsafe_svg");
  }
}

function readUint16BE(buffer: Buffer, offset: number): number {
  return ((buffer[offset] ?? 0) << 8) | (buffer[offset + 1] ?? 0);
}

/** Extracts width/height from PNG, GIF, and JPEG (SOF marker scan) headers.
 * WebP/PDF report null dimensions — not needed for the media library grid. */
export function extractDimensions(buffer: Buffer, mimeType: MediaMimeType): { width: number | null; height: number | null } {
  try {
    if (mimeType === "image/png" && buffer.length >= 24) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (mimeType === "image/gif" && buffer.length >= 10) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
    }
    if (mimeType === "image/jpeg") {
      let offset = 2;
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buffer[offset + 1] ?? 0;
        const isSofMarker = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
        if (isSofMarker) {
          return { height: readUint16BE(buffer, offset + 5), width: readUint16BE(buffer, offset + 7) };
        }
        const segmentLength = readUint16BE(buffer, offset + 2);
        offset += 2 + segmentLength;
      }
    }
  } catch {
    return { width: null, height: null };
  }
  return { width: null, height: null };
}

export function calculateChecksum(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Validates a complete upload: extension from the sanitized filename must
 * agree with the magic-byte-detected MIME type (SVG is verified by content
 * inspection instead, since it has no magic bytes), and the byte size must
 * be within the limit for its kind. Throws `MediaValidationError` on any
 * mismatch — the claimed `Content-Type` header is never trusted alone. */
export function validateUploadBuffer(buffer: Buffer, originalFilename: string): ValidatedMediaInput {
  const filename = sanitizeFilename(originalFilename);
  const extension = (filename.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? "") as MediaExtension;

  let mimeType = detectMagicBytes(buffer);
  if (!mimeType && extension === ".svg") {
    validateSvgSecurity(buffer.toString("utf8", 0, Math.min(buffer.length, 4096)));
    mimeType = "image/svg+xml";
  }
  if (!mimeType) {
    throw new MediaValidationError("Dosya türü tanınmadı veya desteklenmiyor.", "unrecognized_type");
  }

  const allowedExtensions = MIME_EXTENSION_MAP[mimeType];
  if (!allowedExtensions.includes(extension)) {
    throw new MediaValidationError(`Dosya uzantısı (${extension || "yok"}) algılanan tür (${mimeType}) ile uyuşmuyor.`, "extension_mismatch");
  }

  const kind = KIND_BY_MIME[mimeType];
  const maxSize = mimeType === "image/svg+xml" ? MAX_SVG_SIZE_BYTES : kind === "DOCUMENT" ? MAX_DOCUMENT_SIZE_BYTES : MAX_IMAGE_SIZE_BYTES;
  if (buffer.length > maxSize) {
    throw new MediaValidationError(`Dosya ${Math.round(maxSize / (1024 * 1024))} MB sınırını aşıyor.`, "file_too_large");
  }
  if (buffer.length === 0) {
    throw new MediaValidationError("Boş dosya yüklenemez.", "empty_file");
  }

  const dimensions = mimeType === "image/svg+xml" ? { width: null, height: null } : extractDimensions(buffer, mimeType);

  return {
    buffer,
    filename,
    mimeType,
    extension,
    kind,
    byteSize: buffer.length,
    checksum: calculateChecksum(buffer),
    width: dimensions.width,
    height: dimensions.height,
  };
}
