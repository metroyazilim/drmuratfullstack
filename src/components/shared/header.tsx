import { getTranslations } from 'next-intl/server';
import { ChevronDown } from 'lucide-react';
import { getClinic } from '@/lib/content';
import { Container } from '@/components/ui/container';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n';
import { isNavGroup, mainNav } from '@/lib/navigation';
import { Brand } from './brand';
import { NavLink } from './nav-link';
import { LanguageSwitcher } from './language-switcher';
import { MobileMenu } from './mobile-menu';

export async function Header() {
  const t = await getTranslations('nav');
  const tHeader = await getTranslations('header');
  const clinic = getClinic();

  return (
    <header className="border-border-default bg-bg-base sticky top-0 z-40 border-b">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4 md:h-18">
          <Brand />

          <nav className="hidden lg:block" aria-label={t('home')}>
            <ul className="flex items-center gap-1">
              {mainNav.map((item) =>
                isNavGroup(item) ? (
                  // Alt menü CSS group-hover + focus-within ile açılır;
                  // ekstra JS ve client bileşeni gerektirmez.
                  <li key={item.key} className="group relative">
                    <button
                      type="button"
                      className="text-text-primary hover:text-accent-primary inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                      aria-haspopup="true"
                    >
                      {t(item.key)}
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <ul className="border-border-default bg-bg-base invisible absolute start-0 top-full z-50 min-w-52 rounded-lg border p-1.5 opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      {item.children.map((child) => (
                        <li key={child.key}>
                          <NavLink
                            href={child.href}
                            className="text-text-primary hover:bg-bg-surface block rounded-md px-3 py-2 text-sm"
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
                      className="text-text-primary hover:text-accent-primary inline-block rounded-md px-3 py-2 text-sm font-medium transition-colors"
                    >
                      {t(item.key)}
                    </NavLink>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            {/* Mobilde de navbar'da durur; `collapseLabel` ile dar ekranda
                yalnızca globe ikonu kalır, satır kalabalıklaşmaz. */}
            <LanguageSwitcher collapseLabel />
            <Link href="/appointment" className="hidden sm:block">
              <Button variant="primary" size="sm">
                {tHeader('appointmentCta')}
              </Button>
            </Link>
            <MobileMenu
              phone={clinic.contact.phone}
              phoneFormatted={clinic.contact.phoneFormatted}
            />
          </div>
        </div>
      </Container>
    </header>
  );
}
