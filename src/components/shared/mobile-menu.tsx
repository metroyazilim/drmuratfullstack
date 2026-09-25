'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Menu, Phone, X } from 'lucide-react';
import { useTranslations } from '@/lib/strings';
import { NavLink } from './nav-link';
import { isNavGroup, mainNav } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/site-routes';

type MobileMenuProps = {
  phone: string;
  phoneFormatted: string;
};

export function MobileMenu({ phone, phoneFormatted }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('nav');
  const tA11y = useTranslations('a11y');
  const tHeader = useTranslations('header');

  const close = () => setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label={tA11y('openMenu')}
          className="text-text-primary hover:bg-bg-surface inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Radix odak tuzağı, Esc ve body scroll kilidini kendisi yönetir. */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="bg-bg-base fixed inset-y-0 start-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-text-primary text-base font-bold">
              Dr. Murat Irmak
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              {tA11y('openMenu')}
            </Dialog.Description>
            <Dialog.Close
              aria-label={tA11y('closeMenu')}
              className="text-text-muted hover:bg-bg-surface inline-flex h-9 w-9 items-center justify-center rounded-md"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <nav className="mt-8 flex-1">
            <ul className="space-y-1">
              {mainNav.map((item) =>
                isNavGroup(item) ? (
                  <li key={item.key} className="pt-4">
                    <p className="text-text-muted px-3 pb-1 text-xs font-semibold tracking-[0.08em] uppercase">
                      {t(item.key)}
                    </p>
                    <ul>
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <NavLink
                            href={child.href}
                            onNavigate={close}
                            className="text-text-primary hover:bg-bg-surface block rounded-md px-3 py-2.5 text-sm"
                          >
                            {t(child.key)}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </li>
                ) : (
                  <li key={item.key}>
                    <NavLink
                      href={item.href}
                      onNavigate={close}
                      className="text-text-primary hover:bg-bg-surface block rounded-md px-3 py-2.5 text-sm font-medium"
                    >
                      {t(item.key)}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="border-border-default mt-6 space-y-3 border-t pt-6">
            <Link href="/randevu-al" onClick={close} className="block">
              <Button variant="primary" className="w-full">
                {tHeader('appointmentCta')}
              </Button>
            </Link>
            <a
              href={`tel:${phone}`}
              className="text-text-muted hover:text-accent-primary inline-flex items-center gap-2 text-sm"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <bdi>{phoneFormatted}</bdi>
            </a>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
