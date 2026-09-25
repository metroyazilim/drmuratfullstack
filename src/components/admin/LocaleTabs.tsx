'use client';

import { Check, CircleDashed } from 'lucide-react';
import {
  ADMIN_LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  type Locale,
} from '@/lib/admin/locales';
import { cn, localeTab, localeTabActive, localeTabBar } from './ui';

type LocaleTabsProps = {
  activeLocale: Locale;
  completeLocales: readonly Locale[];
  onChange: (locale: Locale) => void;
};

export function LocaleTabs({ activeLocale, completeLocales, onChange }: LocaleTabsProps) {
  return (
    <div hidden={ADMIN_LOCALES.length <= 1} className={localeTabBar} role="tablist" aria-label="İçerik dili">
      {ADMIN_LOCALES.map((locale) => {
        const complete = completeLocales.includes(locale);
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={activeLocale === locale}
            aria-label={`${LOCALE_LABELS[locale]} — ${complete ? 'tamamlandı' : 'eksik'}`}
            className={cn(localeTab, activeLocale === locale && localeTabActive)}
            onClick={() => onChange(locale)}
          >
            {LOCALE_SHORT_LABELS[locale]}
            {complete ? (
              <Check className="size-3.5 text-state-success" aria-hidden="true" />
            ) : (
              <CircleDashed className="size-3.5 opacity-50" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
