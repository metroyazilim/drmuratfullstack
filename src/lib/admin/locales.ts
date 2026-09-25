/**
 * Admin content is single-locale after the public site cutover.
 * Keep this contract centralized so editors, validation and completeness
 * indicators cannot accidentally reintroduce translation tabs.
 */
export type AdminLocale = 'tr';

export const ADMIN_LOCALES: readonly AdminLocale[] = ['tr'];

export const LOCALE_LABELS: Readonly<Record<AdminLocale, string>> = {
  tr: 'Türkçe',
};

export const LOCALE_SHORT_LABELS: Readonly<Record<AdminLocale, string>> = {
  tr: 'TR',
};

export const LOCALE_DIRECTION: Readonly<Record<AdminLocale, 'ltr' | 'rtl'>> = {
  tr: 'ltr',
};

export function isAdminLocale(value: string): value is AdminLocale {
  return value === 'tr';
}

export type { AdminLocale as Locale };
