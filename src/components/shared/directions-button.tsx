import { Navigation } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { ButtonProps } from '@/components/ui/button';

type DirectionsButtonProps = {
  href: string;
  label: string;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
};

/**
 * "Konuma git" — haritayı yeni sekmede açan bağlantı.
 *
 * Buton görünümlü ama <a>: yeni sekmede harita açmak gezinmedir, form
 * eylemi değil. Butonun kendisi <button> olsaydı klavye ve ekran
 * okuyucuda yanlış rol bildirilirdi.
 */
export function DirectionsButton({
  href,
  label,
  variant = 'primary',
  size = 'default',
  className,
}: DirectionsButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), 'gap-2', className)}
    >
      <Navigation className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </a>
  );
}
