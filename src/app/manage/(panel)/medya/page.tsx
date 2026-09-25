import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { cardPadded, pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { hasDatabase, hasMediaStorage } from '@/lib/env';
import { listMediaAssets } from '@/lib/media/service';
import type { MediaKind } from '@/lib/media/types';
import { MediaLibraryView } from './MediaLibraryView';

type SearchParams = Promise<{ page?: string; kind?: string; archived?: string }>;

export default async function MediaPage({ searchParams }: { searchParams: SearchParams }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const kind: MediaKind | undefined =
    params.kind === 'image' ? 'IMAGE' : params.kind === 'document' ? 'DOCUMENT' : undefined;
  const archived = params.archived === '1';
  const result = await listMediaAssets(prisma, { page, kind, archived, pageSize: 24 });

  return (
    <div className={`${pageShell} space-y-6`}>
      <PageHeader
        title="Medya kitaplığı"
        description="Görsel ve belgeleri yükleyin, açıklamalarını düzenleyin ve içeriklerde kullanın."
      />
      {!hasMediaStorage() ? (
        <div className={cardPadded} role="status">
          <p className="text-sm font-bold text-state-error">
            Yerel disk modu — üretimde R2 gerekir
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Yüklenen dosyalar şu anda public/uploads dizinine yazılır.
          </p>
        </div>
      ) : null}
      <MediaLibraryView
        assets={result.assets}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        kind={kind}
        archived={archived}
      />
    </div>
  );
}
