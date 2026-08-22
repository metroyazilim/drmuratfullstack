import { getTranslations } from 'next-intl/server';

/**
 * Her hizmet ve blog detay sayfasında ZORUNLU.
 * Şablona gömülüdür — içerik yazarının eklemesine bırakılmaz, çünkü
 * unutulabilecek bir şey değil (ui-context.md → İçerik Kuralı).
 */
export async function MedicalDisclaimer() {
  const t = await getTranslations('disclaimer');

  return (
    <aside className="bg-bg-tint border-accent-primary mt-10 rounded-md border-s-4 p-5">
      <p className="text-text-primary text-xs font-semibold">{t('title')}</p>
      <p className="text-text-muted mt-1.5 text-xs leading-relaxed">
        {t('medical')}
      </p>
    </aside>
  );
}
