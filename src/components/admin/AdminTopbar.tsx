'use client';

import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { AdminSession } from '@/lib/admin-auth';
import { useAdminNavigation } from './AdminShell';
import { findNavItemByPath } from './nav-items';

export function AdminTopbar({ session }: { session: AdminSession }) {
  const pathname = usePathname();
  const section = findNavItemByPath(pathname);
  const { openMobileMenu } = useAdminNavigation();

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border-default bg-bg-base/90 px-4 py-3 backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openMobileMenu}
          className="flex size-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-surface lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
        <span className="truncate text-sm font-bold text-text-primary">
          {section?.label ?? 'Yönetim paneli'}
        </span>
      </div>
      <span className="hidden truncate text-xs text-text-muted sm:block">{session.name}</span>
    </header>
  );
}
