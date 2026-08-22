import { cn } from '@/lib/utils/cn';

/**
 * Fotoğrafı olmayan ekip üyeleri için baş harf monogramı.
 * Tasarımın kendi çözümü (MK, EB) — eksik görsel değil.
 */
export function Monogram({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase('tr-TR') ?? '')
    .join('');

  return (
    <div
      className={cn(
        'bg-accent-soft flex items-center justify-center',
        className,
      )}
    >
      {/* Erişilebilir ad karttan gelir; monogram salt dekoratiftir. */}
      <span
        className="text-accent-primary/60 text-6xl font-bold tracking-tight"
        aria-hidden="true"
      >
        {initials}
      </span>
    </div>
  );
}
