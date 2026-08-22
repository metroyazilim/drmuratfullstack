import { getTranslations } from 'next-intl/server';

/** Klavye kullanıcıları için: odaklanınca görünür, ana içeriğe atlar. */
export async function SkipLink() {
  const t = await getTranslations('a11y');

  return (
    <a
      href="#main-content"
      className="bg-accent-primary text-text-inverse sr-only rounded-md px-4 py-2 text-sm font-semibold focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-100"
    >
      {t('skipLink')}
    </a>
  );
}
