'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import type { AdminSession } from '@/lib/admin-auth';
import { logoutAction } from '@/app/manage/actions';
import { useAdminNavigation } from './AdminShell';
import { findNavItemByPath, NAV_GROUPS } from './nav-items';
import { cn } from './ui';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'Y';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return `${first}${last}`.toLocaleUpperCase('tr-TR');
}

export function AdminSidebar({ session }: { session: AdminSession }) {
  const pathname = usePathname();
  const activeHref = findNavItemByPath(pathname)?.href ?? null;
  const { mobileOpen, closeMobileMenu } = useAdminNavigation();

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-bg-inverse/40 lg:hidden"
          onClick={closeMobileMenu}
          aria-label="Menüyü kapat"
        />
      ) : null}

      <aside
        aria-label="Yönetim menüsü"
        onKeyDown={(event) => {
          if (event.key === 'Escape') closeMobileMenu();
        }}
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-64 flex-col border-e border-border-default bg-bg-base shadow-sm transition-transform duration-200',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <Link href="/manage" className="flex min-w-0 items-center gap-3" onClick={closeMobileMenu}>
            <Image
              src="/images/brand/logo.png"
              alt="Dr. Murat Irmak"
              width={40}
              height={40}
              className="size-9 rounded-full bg-bg-base object-contain"
              priority
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-text-primary">
                Dr. Murat Irmak
              </span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Yönetim
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="flex size-8 items-center justify-center rounded-md text-text-muted hover:bg-bg-surface lg:hidden"
            aria-label="Menüyü kapat"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-3" aria-label="Panel sayfaları">
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter(
              (item) => !item.requiresSuperAdmin || session.role === 'SUPER_ADMIN',
            );
            return (
              <div key={group.title} className="mb-2">
                <p className="mb-1 px-2 pt-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                  {group.title}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === activeHref;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMobileMenu}
                          aria-current={active ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            active
                              ? 'bg-accent-soft text-accent-primary'
                              : 'text-text-primary hover:bg-bg-surface',
                          )}
                        >
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-border-default bg-bg-surface px-4 py-3">
          <div className="flex items-center gap-2.5 px-1 py-1">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-bg-inverse text-xs font-bold text-text-inverse">
              {initialsOf(session.name)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text-primary">
                {session.name}
              </span>
              <span className="block truncate text-xs text-text-muted">{session.email}</span>
            </span>
          </div>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg-base hover:text-text-primary"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Çıkış yap
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
