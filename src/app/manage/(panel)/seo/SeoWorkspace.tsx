'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileText,
  Pencil,
  Save,
  TriangleAlert,
} from 'lucide-react';
import { SelectField } from '@/components/ui/select-field';
import { useMemo, useState, useTransition } from 'react';
import { Toast } from '@/components/admin/Toast';
import {
  card,
  cn,
  fieldInput,
  fieldLabel,
  fieldTextarea,
  helpText,
  localeTab,
  localeTabActive,
  localeTabBar,
  primaryButton,
  secondaryButton,
} from '@/components/admin/ui';
import {
  ADMIN_LOCALES,
  LOCALE_DIRECTION,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  type Locale,
} from '@/lib/admin/locales';
import { auditLocaleSeo, type SeoAuditCheck } from '@/lib/admin/seo-audit';
import { saveQuickSeoAction } from './actions';

export type SeoLocaleView = Readonly<{
  localeId: string | null;
  locale: Locale;
  path: string;
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: readonly string[];
  ogImage: string;
  heroImageAlt: string;
  noindex: boolean;
  allLocalesComplete: boolean;
}>;

export type SeoWorkspaceEntry = Readonly<{
  key: string;
  label: string;
  group: string;
  editHref: string;
  editable: boolean;
  locales: readonly SeoLocaleView[];
}>;

type QuickDraft = Readonly<{
  title: string;
  description: string;
  ogImage: string;
  noindex: boolean;
}>;

type DetailProps = Readonly<{
  entry: SeoWorkspaceEntry;
  locale: Locale;
  siteUrl: string;
  onLocaleChange: (locale: Locale) => void;
  onSaved: (locale: Locale, draft: QuickDraft) => void;
}>;

function truncatePreview(value: string, limit: number): string {
  const clean = value.trim();
  if (clean.length <= limit) return clean;
  return `${clean.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function scoreTone(score: number): string {
  if (score >= 85) return 'bg-state-success/10 text-state-success';
  if (score >= 65) return 'bg-accent-soft text-accent-primary';
  return 'bg-state-error/10 text-state-error';
}

function checkTone(level: SeoAuditCheck['level']): string {
  if (level === 'ok') return 'text-state-success';
  if (level === 'warn') return 'text-accent-primary';
  return 'text-state-error';
}

function CheckIcon({ level }: { level: SeoAuditCheck['level'] }) {
  if (level === 'ok') return <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />;
  if (level === 'warn') return <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />;
  return <CircleAlert className="size-4 shrink-0" aria-hidden="true" />;
}

function EntryButton({
  entry,
  selected,
  onSelect,
}: {
  entry: SeoWorkspaceEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'page' : undefined}
      className={cn(
        'w-full rounded-md px-3 py-2 text-start transition-colors',
        selected ? 'bg-accent-soft' : 'hover:bg-bg-surface',
      )}
    >
      <span className="block truncate text-sm font-semibold text-text-primary">{entry.label}</span>
      <span className="mt-1 flex flex-wrap gap-1">
        {ADMIN_LOCALES.map((locale) => {
          const value = entry.locales.find((item) => item.locale === locale);
          const score = value ? auditLocaleSeo(value).score : 0;
          return (
            <span
              key={locale}
              className={cn('rounded-md px-1.5 py-0.5 text-xs font-bold', scoreTone(score))}
              title={`${LOCALE_LABELS[locale]} SEO puanı: ${score}`}
            >
              {LOCALE_SHORT_LABELS[locale]} {score}
            </span>
          );
        })}
      </span>
    </button>
  );
}

function SeoChecklist({ checks }: { checks: readonly SeoAuditCheck[] }) {
  return (
    <section className={cn(card, 'p-4')} aria-labelledby="seo-checklist-title">
      <h3 id="seo-checklist-title" className="text-sm font-bold text-text-primary">
        SEO kontrol listesi
      </h3>
      <ul className="mt-3 space-y-3">
        {checks.map((item) => (
          <li key={item.id} className={cn('flex items-start gap-2', checkTone(item.level))}>
            <CheckIcon level={item.level} />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs text-text-muted">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SeoDetail({ entry, locale, siteUrl, onLocaleChange, onSaved }: DetailProps) {
  const localeValue = entry.locales.find((item) => item.locale === locale);
  const emptyValue: SeoLocaleView = {
    localeId: null,
    locale,
    path: `/${locale}`,
    slug: '',
    title: '',
    description: '',
    primaryKeyword: '',
    secondaryKeywords: [],
    ogImage: '',
    heroImageAlt: '',
    noindex: true,
    allLocalesComplete: false,
  };
  const value = localeValue ?? emptyValue;
  const [draft, setDraft] = useState<QuickDraft>({
    title: value.title,
    description: value.description,
    ogImage: value.ogImage,
    noindex: value.noindex,
  });
  const [feedback, setFeedback] = useState<{ message: string; tone: 'success' | 'error' } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const audit = auditLocaleSeo({ ...value, ...draft });
  const previewTitle = truncatePreview(draft.title, 60) || 'Başlık tanımlanmamış';
  const previewDescription =
    truncatePreview(draft.description, 160) || 'Meta açıklama tanımlanmamış.';
  const dirty =
    draft.title !== value.title ||
    draft.description !== value.description ||
    draft.ogImage !== value.ogImage ||
    draft.noindex !== value.noindex;
  const publicUrl = `${siteUrl.replace(/\/$/, '')}${value.path}`;

  function save() {
    if (!value.localeId) return;
    startTransition(async () => {
      const result = await saveQuickSeoAction({ localeId: value.localeId, ...draft });
      if (!result.ok) {
        setFeedback({ message: result.error, tone: 'error' });
        return;
      }
      onSaved(locale, draft);
      setFeedback({ message: result.message ?? 'SEO alanları kaydedildi.', tone: 'success' });
    });
  }

  return (
    <div className="min-w-0 space-y-4">
      {feedback ? <Toast message={feedback.message} tone={feedback.tone} /> : null}

      <section className={cn(card, 'flex flex-wrap items-start justify-between gap-4 p-5')}>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-primary">
            {entry.group}
          </p>
          <h2 className="mt-1 text-xl font-bold text-text-primary">{entry.label}</h2>
          <p className="mt-1 truncate text-xs text-text-muted">{value.path}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={value.path} target="_blank" rel="noreferrer" className={secondaryButton}>
            <ExternalLink className="size-4" aria-hidden="true" />
            Canlı sayfa
          </a>
          <Link href={entry.editHref} className={secondaryButton}>
            <Pencil className="size-4" aria-hidden="true" />
            İçeriği düzenle
          </Link>
        </div>
      </section>

      <div hidden={ADMIN_LOCALES.length <= 1} className={localeTabBar} role="tablist" aria-label="Denetim dili">
        {ADMIN_LOCALES.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={item === locale}
            onClick={() => onLocaleChange(item)}
            className={cn(localeTab, item === locale && localeTabActive)}
          >
            {LOCALE_SHORT_LABELS[item]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={cn(card, 'space-y-5 p-5')} dir={LOCALE_DIRECTION[locale]}>
          <div>
            <label className={fieldLabel} htmlFor="seo-title">
              SEO başlığı
              <span className="ms-2 font-normal normal-case tracking-normal">
                {draft.title.length}/70
              </span>
            </label>
            <input
              id="seo-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              disabled={!entry.editable || !value.localeId}
              className={fieldInput}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="seo-description">
              Meta açıklama
              <span className="ms-2 font-normal normal-case tracking-normal">
                {draft.description.length}/165
              </span>
            </label>
            <textarea
              id="seo-description"
              rows={5}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              disabled={!entry.editable || !value.localeId}
              className={fieldTextarea}
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="seo-og-image">
              Sosyal paylaşım görseli
            </label>
            <input
              id="seo-og-image"
              value={draft.ogImage}
              onChange={(event) => setDraft({ ...draft, ogImage: event.target.value })}
              disabled={!entry.editable || !value.localeId}
              className={fieldInput}
            />
            <p className={helpText}>/images/og/ yolu veya tam bir http(s) adresi kullanın.</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <input
              type="checkbox"
              checked={draft.noindex}
              onChange={(event) => setDraft({ ...draft, noindex: event.target.checked })}
              disabled={!entry.editable || !value.localeId}
              className="size-4 rounded-md border-border-default text-accent-primary"
            />
            Arama motorlarının bu sayfayı dizine eklemesini engelle
          </label>

          {entry.editable && value.localeId ? (
            <div className="flex justify-end border-t border-border-default pt-4">
              <button
                type="button"
                onClick={save}
                disabled={pending || !dirty}
                className={primaryButton}
              >
                <Save className="size-4" aria-hidden="true" />
                {pending ? 'Kaydediliyor…' : 'Hızlı SEO alanlarını kaydet'}
              </button>
            </div>
          ) : (
            <p className="rounded-md bg-bg-surface p-3 text-sm text-text-muted">
              Bu sayfanın SEO alanları sayfa metinleri ekranından yönetilir; burada salt okunur
              denetim gösterilir.
            </p>
          )}
        </section>

        <div className="space-y-4">
          <section className={cn(card, 'p-4')} aria-label="Google arama sonucu önizlemesi">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Google arama sonucu önizlemesi
            </p>
            <p className="mt-3 truncate text-xs text-text-muted">{publicUrl}</p>
            <p className="mt-1 text-lg leading-snug text-accent-primary">{previewTitle}</p>
            <p className="mt-1 text-sm leading-5 text-text-muted">{previewDescription}</p>
          </section>

          <section className={cn(card, 'overflow-hidden')} aria-label="Sosyal kart önizlemesi">
            <p className="px-4 pt-4 text-xs font-bold uppercase tracking-wider text-text-muted">
              Sosyal kart önizlemesi
            </p>
            <div className="m-4 overflow-hidden rounded-md border border-border-default">
              {draft.ogImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.ogImage} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-bg-surface text-sm text-text-muted">
                  Paylaşım görseli tanımlanmamış
                </div>
              )}
              <div className="space-y-1 bg-bg-surface p-3">
                <p className="truncate text-xs uppercase text-text-muted">{siteUrl}</p>
                <p className="text-sm font-semibold text-text-primary">{previewTitle}</p>
                <p className="text-xs text-text-muted">{truncatePreview(draft.description, 110)}</p>
              </div>
            </div>
          </section>

          <SeoChecklist checks={audit.checks} />
        </div>
      </div>
    </div>
  );
}

export function SeoWorkspace({
  initialEntries,
  initialItem,
  siteUrl,
}: {
  initialEntries: readonly SeoWorkspaceEntry[];
  initialItem: string | null;
  siteUrl: string;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const firstKey = entries[0]?.key ?? '';
  const [selectedKey, setSelectedKey] = useState(
    initialItem && entries.some((entry) => entry.key === initialItem) ? initialItem : firstKey,
  );
  const [locale, setLocale] = useState<Locale>('tr');
  const selected = entries.find((entry) => entry.key === selectedKey) ?? entries[0];
  const groups = useMemo(
    () =>
      Array.from(new Set(entries.map((entry) => entry.group))).map((group) => ({
        group,
        entries: entries.filter((entry) => entry.group === group),
      })),
    [entries],
  );

  function selectEntry(key: string) {
    setSelectedKey(key);
    const url = new URL(window.location.href);
    url.searchParams.set('item', key);
    window.history.replaceState(null, '', url);
  }

  function updateSaved(savedLocale: Locale, draft: QuickDraft) {
    setEntries((current) =>
      current.map((entry) =>
        entry.key !== selectedKey
          ? entry
          : {
              ...entry,
              locales: entry.locales.map((item) =>
                item.locale === savedLocale ? { ...item, ...draft } : item,
              ),
            },
      ),
    );
  }

  if (!selected) {
    return (
      <div className="rounded-lg border border-dashed border-border-default p-10 text-center">
        <FileText className="mx-auto size-8 text-text-muted" aria-hidden="true" />
        <p className="mt-3 text-sm text-text-muted">Denetlenecek sayfa bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <aside className="lg:sticky lg:top-20 lg:self-start" aria-label="SEO sayfaları">
        <label className="block lg:hidden">
          <span className={fieldLabel}>Denetlenecek sayfa</span>
          <SelectField
            value={selected.key}
            onValueChange={selectEntry}
            className={fieldInput}
            placeholder="Sayfa seçin"
            options={entries.map((entry) => ({ value: entry.key, label: entry.label }))}
          />
        </label>
        <nav className={cn(card, 'hidden space-y-5 p-3 lg:block')}>
          {groups.map(({ group, entries: groupEntries }) => (
            <section key={group}>
              <h2 className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                {group}
              </h2>
              <div className="space-y-1">
                {groupEntries.map((entry) => (
                  <EntryButton
                    key={entry.key}
                    entry={entry}
                    selected={entry.key === selected.key}
                    onSelect={() => selectEntry(entry.key)}
                  />
                ))}
              </div>
            </section>
          ))}
        </nav>
      </aside>
      <main className="lg:col-span-2">
        <SeoDetail
          key={`${selected.key}:${locale}`}
          entry={selected}
          locale={locale}
          siteUrl={siteUrl}
          onLocaleChange={setLocale}
          onSaved={updateSaved}
        />
      </main>
    </div>
  );
}
