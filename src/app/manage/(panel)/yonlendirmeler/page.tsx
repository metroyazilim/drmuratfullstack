import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { legacyRedirects } from '@/lib/seo/legacy-redirects';
import { RedirectsManager } from './RedirectsManager';

export default async function RedirectsPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const redirects = await prisma.redirect.findMany({
    orderBy: [{ isActive: 'desc' }, { source: 'asc' }],
  });
  const destinationBySource = Object.fromEntries(
    redirects.filter((row) => row.isActive).map((row) => [row.source, row.destination]),
  );
  const registeredSources = new Set(redirects.map((row) => row.source));

  return (
    <div className={pageShell}>
      <PageHeader
        title="Yönlendirmeler"
        description="Eski adresleri yeni sayfalara taşıyın; yönlendirme zincirlerini ve etkinlik durumunu denetleyin."
      />
      <RedirectsManager
        redirects={redirects.map((row) => ({
          id: row.id,
          source: row.source,
          destination: row.destination,
          permanent: row.permanent,
          isActive: row.isActive,
          note: row.note,
          chainDestination: destinationBySource[row.destination] ?? null,
        }))}
        legacyRedirects={legacyRedirects.map((row) => ({
          ...row,
          imported: registeredSources.has(row.source),
        }))}
      />
    </div>
  );
}
