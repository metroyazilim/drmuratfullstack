'use client';

import type { ContentStatus, ContentType } from '@prisma/client';
import { ArrowDown, ArrowUp, Pencil, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SelectField } from '@/components/ui/select-field';
import { useMemo, useState, useTransition } from 'react';
import { EmptyState } from './EmptyState';
import { PageHeader } from './PageHeader';
import { StatusBadge } from './StatusBadge';
import {
  ADMIN_LOCALES,
  LOCALE_SHORT_LABELS,
  isAdminLocale,
  type Locale,
} from '@/lib/admin/locales';
import { reorderAction, type ContentActionResult } from '@/app/manage/(panel)/icerik/actions';
import {
  cn,
  fieldInput,
  fieldSuccess,
  helpText,
  iconButton,
  primaryButton,
  table,
  tableBody,
  tableCell,
  tableHeadCell,
  tableHeadRow,
  tableRow,
  tableWrap,
} from './ui';

export type ContentListRow = {
  id: string;
  key: string;
  status: ContentStatus;
  order: number;
  updatedAt: string;
  locales: Array<{ locale: string; title: string; complete: boolean }>;
};

type ContentListViewProps = {
  type: ContentType;
  label: string;
  singular: string;
  segment: string;
  hasOrder: boolean;
  canCreate: boolean;
  entries: ContentListRow[];
};

const INITIAL_RESULT: ContentActionResult = { ok: true };

const STATUS_OPTIONS: ReadonlyArray<{ value: '' | ContentStatus; label: string }> = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'DRAFT', label: 'Taslak' },
  { value: 'PUBLISHED', label: 'Yayında' },
  { value: 'ARCHIVED', label: 'Arşivde' },
];

export function ContentListView({
  type,
  label,
  singular,
  segment,
  hasOrder,
  canCreate,
  entries,
}: ContentListViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'' | ContentStatus>('');
  const [rows, setRows] = useState(entries);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isReordering, startReorderTransition] = useTransition();

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('tr-TR');
    return rows.filter((entry) => {
      const title = entry.locales.find((locale) => locale.locale === 'tr')?.title ?? '';
      const matchesQuery =
        !normalizedQuery ||
        entry.key.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
        title.toLocaleLowerCase('tr-TR').includes(normalizedQuery);
      return matchesQuery && (!status || entry.status === status);
    });
  }, [query, rows, status]);

  const moveEntry = (id: string, offset: -1 | 1) => {
    const currentIndex = rows.findIndex((entry) => entry.id === id);
    const targetIndex = currentIndex + offset;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= rows.length) return;

    const reordered = [...rows];
    const current = reordered[currentIndex];
    const target = reordered[targetIndex];
    if (!current || !target) return;
    reordered[currentIndex] = target;
    reordered[targetIndex] = current;
    setRows(reordered);
    setFeedback(null);

    startReorderTransition(async () => {
      const formData = new FormData();
      formData.set('type', type);
      formData.set('orderedIds', JSON.stringify(reordered.map((entry) => entry.id)));
      const result = await reorderAction(INITIAL_RESULT, formData);
      if (!result.ok) {
        setRows(rows);
        setFeedback(result.error);
        return;
      }
      setFeedback(result.message ?? 'Sıralama güncellendi.');
      router.refresh();
    });
  };

  return (
    <div>
      <PageHeader
        title={label}
        description={`${label} içeriklerini ve dört dildeki tamamlanma durumlarını yönetin.`}
        actions={
          canCreate ? (
            <Link href={`/manage/icerik/${segment}/yeni`} className={primaryButton}>
              <Plus className="size-4" aria-hidden="true" />
              Yeni {singular}
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-3 rounded-lg border border-border-default bg-bg-base p-4 md:grid-cols-2">
        <label className="relative">
          <span className="sr-only">Ara</span>
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <input
            value={query}
            className={`${fieldInput} mt-0 ps-9`}
            placeholder="Başlık veya anahtar ara"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">Duruma göre filtrele</span>
          <SelectField
            value={status}
            className={`${fieldInput} mt-0`}
            onValueChange={(value) => {
              const nextStatus = STATUS_OPTIONS.find((option) => option.value === value)?.value;
              if (nextStatus !== undefined) setStatus(nextStatus);
            }}
            placeholder="Tüm durumlar"
            clearLabel="Tüm durumlar"
            options={STATUS_OPTIONS.filter((option) => option.value).map((option) => ({ value: option.value, label: option.label }))}
          />
        </label>
      </div>

      {feedback ? (
        <p className={feedback === 'Sıralama güncellendi.' ? fieldSuccess : helpText}>{feedback}</p>
      ) : null}

      {filteredRows.length === 0 ? (
        <EmptyState
          title="İçerik bulunamadı"
          description={query || status ? 'Arama veya filtre ölçütlerini değiştirin.' : 'Henüz kayıt yok.'}
        />
      ) : (
        <div className={tableWrap}>
          <table className={table}>
            <thead>
              <tr className={tableHeadRow}>
                <th className={tableHeadCell}>Başlık</th>
                <th className={tableHeadCell}>Anahtar</th>
                <th className={tableHeadCell}>Durum</th>
                <th className={tableHeadCell}>Diller</th>
                {hasOrder ? <th className={tableHeadCell}>Sıra</th> : null}
                <th className={tableHeadCell}>Son güncelleme</th>
                <th className={tableHeadCell}>İşlem</th>
              </tr>
            </thead>
            <tbody className={tableBody}>
              {filteredRows.map((entry) => {
                const localeMap: Partial<Record<Locale, string>> = {};
                const localeComplete: Partial<Record<Locale, boolean>> = {};
                for (const locale of entry.locales) {
                  if (isAdminLocale(locale.locale)) {
                    localeMap[locale.locale] = locale.title;
                    localeComplete[locale.locale] = locale.complete;
                  }
                }
                return (
                  <tr key={entry.id} className={tableRow}>
                    <td className={`${tableCell} font-semibold`}>
                      {localeMap.tr || 'Türkçe başlık eksik'}
                    </td>
                    <td className={`${tableCell} font-mono text-xs text-text-muted`}>{entry.key}</td>
                    <td className={tableCell}>
                      <StatusBadge status={entry.status} />
                    </td>
                    <td className={tableCell}>
                      <div className="flex flex-wrap gap-1">
                        {ADMIN_LOCALES.map((locale) => (
                          <span
                            key={locale}
                            title={
                              localeComplete[locale]
                                ? `${localeMap[locale]} — tamamlandı`
                                : 'Eksik veya geçersiz'
                            }
                            className={cn(
                              'rounded-md border px-1.5 py-0.5 text-xs font-bold',
                              localeComplete[locale]
                                ? 'border-state-success/30 bg-state-success/5 text-state-success'
                                : 'border-border-default bg-bg-surface text-text-muted opacity-50',
                            )}
                          >
                            {LOCALE_SHORT_LABELS[locale]}
                          </span>
                        ))}
                      </div>
                    </td>
                    {hasOrder ? (
                      <td className={tableCell}>
                        <div className="flex items-center gap-1">
                          <span className="min-w-5 text-center">{entry.order}</span>
                          <button
                            type="button"
                            className={iconButton}
                            disabled={isReordering || rows[0]?.id === entry.id}
                            aria-label="Yukarı taşı"
                            onClick={() => moveEntry(entry.id, -1)}
                          >
                            <ArrowUp className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={iconButton}
                            disabled={isReordering || rows.at(-1)?.id === entry.id}
                            aria-label="Aşağı taşı"
                            onClick={() => moveEntry(entry.id, 1)}
                          >
                            <ArrowDown className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    ) : null}
                    <td className={`${tableCell} whitespace-nowrap text-text-muted`}>
                      {new Intl.DateTimeFormat('tr-TR', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(entry.updatedAt))}
                    </td>
                    <td className={tableCell}>
                      <Link
                        href={`/manage/icerik/${segment}/${entry.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-accent-primary hover:text-accent-hover"
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                        Düzenle
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
