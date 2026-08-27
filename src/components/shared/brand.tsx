import Image from 'next/image';
import { Link } from '@/lib/i18n';
import { getClinic } from '@/lib/content';
import { cn } from '@/lib/utils/cn';

type BrandProps = {
  className?: string;
  inverse?: boolean;
};

/** Klinik mührü — public/images/brand/logo.png (1:1'e yakın, saydam zemin). */
export const BRAND_LOGO = '/images/brand/logo.png';

/**
 * Logo + kelime markası.
 *
 * Mühür lacivert (#012D5B) ve saydam zeminli; koyu footer'da okunmaz.
 * `inverse` durumunda beyaz bir daire üzerine oturtulur — logoyu beyaza
 * boyamak yerine zemin verilir, çünkü mührün içindeki ince çizgiler
 * tek renge düşünce kayboluyor.
 */
export function Brand({ className, inverse = false }: BrandProps) {
  const clinic = getClinic();

  return (
    <Link
      href="/"
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          inverse && 'bg-white p-0.5',
        )}
      >
        <Image
          src={BRAND_LOGO}
          alt=""
          // `sizes` YOK: sabit 40px'lik bir logoda `sizes` vermek Next'i
          // deviceSizes tabanlı srcset üretmeye iter ve tarayıcı 3840px'lik
          // varyantı çekiyordu. width/height ile 1x/2x srcset üretilir.
          width={40}
          height={40}
          className="h-full w-full object-contain"
          aria-hidden="true"
        />
      </span>
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          inverse ? 'text-text-inverse' : 'text-text-primary',
        )}
      >
        {clinic.doctor.name}
      </span>
    </Link>
  );
}
