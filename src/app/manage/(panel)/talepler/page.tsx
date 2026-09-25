import type { SubmissionKind } from '@prisma/client';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { cardPadded, pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import {
  getSubmissionRetentionDays,
  purgeExpiredSubmissions,
} from '@/lib/admin/site-settings';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { SubmissionsView } from './SubmissionsView';

const PAGE_SIZE = 25;
type SearchParams = Promise<{ page?: string; kind?: string }>;

export default async function SubmissionsPage({ searchParams }: { searchParams: SearchParams }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();
  await purgeExpiredSubmissions();

  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const kind: SubmissionKind = params.kind === 'contact' ? 'CONTACT' : 'APPOINTMENT';
  const where = { kind };
  const [submissions, total, retentionDays] = await Promise.all([
    prisma.formSubmission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        kind: true,
        status: true,
        fullName: true,
        phone: true,
        serviceKey: true,
        mailDelivered: true,
        createdAt: true,
      },
    }),
    prisma.formSubmission.count({ where }),
    getSubmissionRetentionDays(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className={`${pageShell} space-y-6`}>
      <PageHeader
        title="Talep kutusu"
        description="Randevu ve iletişim formlarından gelen talepleri yönetin."
      />
      <div className={cardPadded} role="note">
        <p className="text-sm font-semibold text-text-primary">
          Talepler {retentionDays} gün sonra otomatik silinir.
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Süresi dolan kayıtlar bu ekran açıldığında KVKK kapsamında temizlenir.
        </p>
      </div>
      <SubmissionsView
        submissions={submissions}
        kind={kind}
        page={page}
        totalPages={totalPages}
      />
    </div>
  );
}
