import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { isAdminLocale, type Locale } from '@/lib/admin/locales';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { FaqManager, type FaqManagerEntry } from './FaqManager';

export default async function FaqPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const rows = await prisma.faqEntry.findMany({
    include: { locales: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  const entries: FaqManagerEntry[] = rows.map((row) => {
    const locales: Partial<
      Record<Locale, { question: string; answer: string; category: string }>
    > = {};
    for (const localized of row.locales) {
      if (!isAdminLocale(localized.locale)) continue;
      locales[localized.locale] = {
        question: localized.question,
        answer: localized.answer,
        category: localized.category ?? '',
      };
    }
    return { id: row.id, key: row.key, locales };
  });

  return (
    <div className={pageShell}>
      <PageHeader
        title="Sık Sorulan Sorular"
        description="Soruları dört dilde düzenleyin, kategoriye göre filtreleyin ve sitedeki sıralarını değiştirin."
      />
      <FaqManager entries={entries} />
    </div>
  );
}
