import { ImageOff } from 'lucide-react';

export function RowThumbnail({ src, alt }: { src: string | null | undefined; alt: string }) {
  if (!src) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-bg-surface text-text-muted">
        <ImageOff className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-md bg-bg-surface">
      {/* Uzak R2 adresleri çalışma anında değişir; Next Image alan adı listesi sabit olamaz. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    </span>
  );
}
