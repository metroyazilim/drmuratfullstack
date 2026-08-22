'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, type Locale } from '@/lib/i18n';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const languageNames: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  ar: 'العربية',
  ru: 'Русский',
};

const supportedLocales: Locale[] = ['tr', 'en', 'ar', 'ru'];

export function LanguageSwitcher({ className }: { className?: string }) {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const tA11y = useTranslations('a11y');

  const handleLanguageChange = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;
    // router.replace with { locale } navigates to the matching translated pathname
    router.replace(pathname as any, { locale: nextLocale });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={tA11y('languageSwitcher')}
        className={cn(
          'border-border-default bg-bg-base text-text-primary hover:bg-bg-surface focus-visible:ring-accent-primary inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          className,
        )}
      >
        <Globe className="text-accent-primary h-3.5 w-3.5" />
        <span>{languageNames[currentLocale] || currentLocale}</span>
        <ChevronDown className="text-text-muted h-3 w-3 opacity-70" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="border-border-default bg-bg-base text-text-primary animate-in fade-in-80 z-50 min-w-[140px] overflow-hidden rounded-lg border p-1 shadow-lg"
        >
          {supportedLocales.map((loc) => {
            const isSelected = loc === currentLocale;
            return (
              <DropdownMenu.Item
                key={loc}
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => handleLanguageChange(loc)}
                className={cn(
                  'hover:bg-accent-soft hover:text-accent-primary focus:bg-accent-soft focus:text-accent-primary flex cursor-pointer items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors outline-none select-none',
                  isSelected &&
                    'bg-bg-surface text-accent-primary font-semibold',
                )}
              >
                <span>{languageNames[loc]}</span>
                {isSelected && (
                  <Check className="text-accent-primary h-3.5 w-3.5" />
                )}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
