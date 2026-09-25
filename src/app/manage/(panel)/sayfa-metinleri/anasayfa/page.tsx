import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { isAdminLocale, type Locale } from '@/lib/admin/locales';
import { homeSchema } from '@/lib/content/schemas';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { HomeEditor } from './HomeEditor';

export default async function HomeContentPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const rows = await prisma.homeContent.findMany({ orderBy: { locale: 'asc' } });
  const initialContent: Partial<Record<Locale, unknown>> = {};
  for (const row of rows) {
    if (!isAdminLocale(row.locale)) continue;
    const parsed = homeSchema.safeParse(row.data);
    if (parsed.success) initialContent[row.locale] = parsed.data;
  }

  return (
    <div className={pageShell}>
      <PageHeader
        title="Anasayfa Blokları"
        description="Anasayfadaki bölüm başlıklarını, açıklamaları, görselleri ve buton metinlerini dört dilde yönetin."
      />
      <HomeEditor initialContent={initialContent} />
    </div>
  );
}
