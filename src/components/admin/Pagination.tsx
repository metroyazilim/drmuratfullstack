import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, helpText, secondaryButton } from './ui';

type QueryValue = string | number | boolean | undefined;

export function Pagination({
  page,
  totalPages,
  basePath,
  query,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Readonly<Record<string, QueryValue>>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(target: number): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) params.set(key, String(value));
    }
    params.set('page', String(target));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-5 py-3.5"
      aria-label="Sayfalama"
    >
      <p className={helpText}>
        {page}. sayfa / {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={cn(secondaryButton, page <= 1 && 'pointer-events-none opacity-40')}
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
          Önceki
        </Link>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={cn(
            secondaryButton,
            page >= totalPages && 'pointer-events-none opacity-40',
          )}
        >
          Sonraki
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
