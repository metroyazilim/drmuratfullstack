import type { ContentType } from '@prisma/client';
import type { z } from 'zod';
import { CONTENT_TYPES, mergeFrontmatter, type ContentLocaleRow } from './content-model';
import { ADMIN_LOCALES, isAdminLocale, type Locale } from './locales';
import { SITE_NAME } from '@/lib/seo/config';

type ValidationSuccess = {
  ok: true;
  frontmatter: Record<string, unknown>;
};

type ValidationFailure = {
  ok: false;
  fieldErrors: Record<string, string>;
};

export type LocaleValidationResult = ValidationSuccess | ValidationFailure;

function formatIssuePath(issue: z.ZodIssue): string {
  return issue.path.map(String).join('.') || 'form';
}

export function composedTitleLength(title: string, _locale: Locale): number {
  return `${title} | ${SITE_NAME}`.length;
}

export function validateLocaleInput(
  type: ContentType,
  _locale: Locale,
  input: unknown,
): LocaleValidationResult {
  const parsed = CONTENT_TYPES[type].schema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = formatIssuePath(issue);
      fieldErrors[path] ??= issue.message;
    }
    return { ok: false, fieldErrors };
  }


  return { ok: true, frontmatter: parsed.data };
}

export type CompletenessEntry = {
  type: ContentType;
  locales: ReadonlyArray<ContentLocaleRow & { locale: string }>;
};

export function describeCompleteness(entry: CompletenessEntry): {
  complete: boolean;
  missing: Locale[];
} {
  const validLocales = new Set<Locale>();

  for (const row of entry.locales) {
    if (!isAdminLocale(row.locale)) continue;
    const result = validateLocaleInput(entry.type, row.locale, mergeFrontmatter(row));
    if (result.ok) validLocales.add(row.locale);
  }

  const missing = ADMIN_LOCALES.filter((locale) => !validLocales.has(locale));
  return { complete: missing.length === 0, missing };
}
