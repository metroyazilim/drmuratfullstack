import { CheckCircle2, Languages, Pencil, TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  iconButton,
  pageShell,
  table,
  tableBody,
  tableCell,
  tableHeadCell,
  tableHeadRow,
  tableRow,
  tableWrap,
} from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { LISTING_KEYS, LISTING_LABELS } from '@/lib/admin/structured-content';
import { ADMIN_LOCALES } from '@/lib/admin/locales';
import { listingSchemas } from '@/lib/content/schemas';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';

export default async function ListingContentPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const rows = await prisma.listingContent.findMany({
    where: { key: { in: [...LISTING_KEYS] } },
    select: { key: true, locale: true, data: true },
  });

  return (
    <div className={pageShell}>
      <PageHeader
        title="Liste Sayfası Metinleri"
        description="Hizmet, blog, ekip ve diğer liste sayfalarının çerçeve metinlerini dört dilde yönetin."
      />

      <div className={tableWrap}>
        <table className={table}>
          <thead>
            <tr className={tableHeadRow}>
              <th className={tableHeadCell}>Sayfa</th>
              <th className={tableHeadCell}>Dil durumu</th>
              <th className={tableHeadCell}>Tamamlanma</th>
              <th className={tableHeadCell} aria-label="İşlemler" />
            </tr>
          </thead>
          <tbody className={tableBody}>
            {LISTING_KEYS.map((key) => {
              const completedLocales = new Set(
                rows
                  .filter(
                    (row) =>
                      row.key === key && listingSchemas[key].safeParse(row.data).success,
                  )
                  .map((row) => row.locale),
              );
              const completed = ADMIN_LOCALES.filter((locale) =>
                completedLocales.has(locale),
              ).length;
              const isComplete = completed === ADMIN_LOCALES.length;
              return (
                <tr key={key} className={tableRow}>
                  <td className={tableCell}>
                    <span className="flex items-center gap-2 font-semibold">
                      <Languages className="size-4 text-accent-primary" aria-hidden="true" />
                      {LISTING_LABELS[key]}
                    </span>
                  </td>
                  <td className={tableCell}>
                    <span className="text-xs text-text-muted">
                      {ADMIN_LOCALES.map((locale) =>
                        completedLocales.has(locale) ? locale.toUpperCase() : '—',
                      ).join(' · ')}
                    </span>
                  </td>
                  <td className={tableCell}>
                    <span
                      className={
                        isComplete
                          ? 'inline-flex items-center gap-1.5 text-xs font-semibold text-state-success'
                          : 'inline-flex items-center gap-1.5 text-xs font-semibold text-state-error'
                      }
                    >
                      {isComplete ? (
                        <CheckCircle2 className="size-4" aria-hidden="true" />
                      ) : (
                        <TriangleAlert className="size-4" aria-hidden="true" />
                      )}
                      {completed}/4 dil
                    </span>
                  </td>
                  <td className={`${tableCell} text-end`}>
                    <Link
                      href={`/manage/sayfa-metinleri/liste/${key}`}
                      className={iconButton}
                      aria-label={`${LISTING_LABELS[key]} metinlerini düzenle`}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
