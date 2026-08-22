'use client';

import { Link, usePathname } from '@/lib/i18n';
import type { NavHref } from '@/lib/navigation';
import { cn } from '@/lib/utils/cn';

type NavLinkProps = {
  href: NavHref;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  onNavigate?: () => void;
};

/**
 * Aktif route vurgusu için gereken tek client parçası.
 * usePathname locale'siz yol döndürür, bu yüzden karşılaştırma dil bağımsızdır.
 */
export function NavLink({
  href,
  children,
  className,
  activeClassName = 'text-accent-primary',
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(className, isActive && activeClassName)}
    >
      {children}
    </Link>
  );
}
