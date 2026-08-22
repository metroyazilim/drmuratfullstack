import { Link } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

type BrandProps = {
  className?: string;
  inverse?: boolean;
};

/**
 * Logo + kelime markası. Gerçek logo SPEC-011'de gelecek; şimdilik
 * token'lardan kurulmuş bir işaret kullanılıyor (yer tutucu görsel değil,
 * çünkü alt metni olmayan bir görsel yayınlamak istemiyoruz).
 */
export function Brand({ className, inverse = false }: BrandProps) {
  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      <span
        className="bg-accent-primary text-text-inverse flex h-9 w-9 items-center justify-center rounded-lg text-lg font-bold"
        aria-hidden="true"
      >
        D
      </span>
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          inverse ? 'text-text-inverse' : 'text-text-primary',
        )}
      >
        Dr. Murat Irmak
      </span>
    </Link>
  );
}
