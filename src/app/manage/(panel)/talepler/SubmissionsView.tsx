'use client';

import type { SubmissionKind, SubmissionStatus } from '@prisma/client';
import { Inbox } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { EmptyState } from '@/components/admin/EmptyState';
import { Pagination } from '@/components/admin/Pagination';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  cn,
  localeTab,
  localeTabActive,
  localeTabBar,
  secondaryButton,
  table,
  tableBody,
  tableCell,
  tableHeadCell,
  tableHeadRow,
  tableRow,
  tableWrap,
} from '@/components/admin/ui';
import {
  deleteSubmissionAction,
  updateSubmissionStatusAction,
  type SubmissionActionResult,
} from './actions';
export type SubmissionListItem = {
  id: string;
  kind: SubmissionKind;
  status: SubmissionStatus;
  fullName: string;
  phone: string;
  serviceKey: string | null;
  mailDelivered: boolean;
  createdAt: Date;
};

function filterHref(kind: SubmissionKind): string {
  const params = new URLSearchParams({ kind: kind.toLowerCase() });
  return `/manage/talepler?${params.toString()}`;
}

export function SubmissionsView({
  submissions,
  kind,
  page,
  totalPages,
}: {
  submissions: readonly SubmissionListItem[];
  kind: SubmissionKind;
  page: number;
  totalPages: number;
}) {
  const query = {
    kind: kind.toLowerCase(),
  };

  return (
    <div className="space-y-5">
      <div className={localeTabBar}>
        <Link
          href={filterHref('APPOINTMENT')}
          className={`${localeTab} ${kind === 'APPOINTMENT' ? localeTabActive : ''}`}
        >
          Randevu
        </Link>
        <Link
          href={filterHref('CONTACT')}
          className={`${localeTab} ${kind === 'CONTACT' ? localeTabActive : ''}`}
        >
          İletişim
        </Link>
      </div>

      {submissions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Talep bulunamadı"
          description="Seçili sekmeye uygun talep yok."
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr className={tableHeadRow}>
                <th className={tableHeadCell}>Ad soyad</th>
                <th className={tableHeadCell}>Telefon</th>
                <th className={tableHeadCell}>Hizmet</th>
                <th className={tableHeadCell}>Tarih</th>
                <th className={tableHeadCell}>Durum</th>
                <th className={tableHeadCell}>E-posta</th>
                <th className={tableHeadCell}>İşlem</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {submissions.map((submission) => (
                <tr
                  key={submission.id}
                  className={cn(tableRow, submission.status === 'NEW' && 'bg-bg-surface')}
                >
                  <td className={`${tableCell} font-semibold`}>
                    {submission.status === 'NEW' ? (
                      <span
                        className="mr-2 inline-block size-2 shrink-0 rounded-full bg-blue-500"
                        aria-hidden="true"
                      />
                    ) : null}
                    {submission.fullName}
                  </td>
                  <td className={tableCell}>{submission.phone}</td>
                  <td className={tableCell}>{submission.serviceKey || '—'}</td>
                  <td className={tableCell}>
                    {new Intl.DateTimeFormat('tr-TR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(submission.createdAt)}
                  </td>
                  <td className={tableCell}>
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className={tableCell}>
                    {submission.mailDelivered ? (
                      <span className="font-semibold text-state-success">Gönderildi</span>
                    ) : (
                      <span className="font-semibold text-state-error">Mail gitmedi</span>
                    )}
                  </td>
                  <td className={tableCell}>
                    <Link href={`/manage/talepler/${submission.id}`} className={secondaryButton}>
                      Görüntüle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/manage/talepler"
        query={query}
      />
    </div>
  );
}

export function SubmissionActions({
  submissionId,
  status,
}: {
  submissionId: string;
  status: SubmissionStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmissionActionResult | null>(null);

  function updateStatus(nextStatus: 'READ' | 'ARCHIVED') {
    startTransition(async () => {
      const nextResult = await updateSubmissionStatusAction(submissionId, nextStatus);
      setResult(nextResult);
      if (nextResult.ok) router.refresh();
    });
  }

  function deleteSubmission() {
    if (!window.confirm('Bu talep kalıcı olarak silinecek. İşlem geri alınamaz.')) return;
    startTransition(async () => {
      const nextResult = await deleteSubmissionAction(submissionId);
      setResult(nextResult);
      if (nextResult.ok) router.push('/manage/talepler');
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === 'NEW' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => updateStatus('READ')}
            className={secondaryButton}
          >
            Okundu işaretle
          </button>
        ) : null}
        {status !== 'ARCHIVED' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => updateStatus('ARCHIVED')}
            className={secondaryButton}
          >
            Arşivle
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={deleteSubmission}
          className="inline-flex items-center rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider text-state-error hover:bg-state-error/10 disabled:opacity-60"
        >
          Sil
        </button>
      </div>
      {result ? (
        <p
          className={
            result.ok
              ? 'rounded-md border border-state-success/30 bg-state-success/5 px-3 py-2 text-sm text-state-success'
              : 'rounded-md border border-state-error/30 bg-state-error/5 px-3 py-2 text-sm text-state-error'
          }
          role="status"
        >
          {result.ok ? result.message : result.error}
        </p>
      ) : null}
    </div>
  );
}
