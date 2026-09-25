'use client';

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useMemo, useState, useTransition } from 'react';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { SelectField } from '@/components/ui/select-field';
import { EmptyState } from '@/components/admin/EmptyState';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { Toast } from '@/components/admin/Toast';
import {
  cardPadded,
  cn,
  fieldError,
  fieldInput,
  fieldLabel,
  helpText,
  iconButton,
  localeTab,
  localeTabActive,
  localeTabBar,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from '@/components/admin/ui';
import {
  ADMIN_LOCALES,
  LOCALE_DIRECTION,
  LOCALE_SHORT_LABELS,
  type Locale,
} from '@/lib/admin/locales';
import {
  createFaqAction,
  deleteFaqAction,
  moveFaqAction,
  updateFaqAction,
  type FaqActionState,
} from './actions';

type FaqLocaleValue = {
  question: string;
  answer: string;
  category: string;
};

export type FaqManagerEntry = {
  id: string;
  key: string;
  locales: Partial<Record<Locale, FaqLocaleValue>>;
};

type FaqLocaleFieldsProps = {
  locale: Locale;
  values?: FaqLocaleValue;
  active: boolean;
  errors?: Record<string, string>;
};

function FaqLocaleFields({ locale, values, active, errors }: FaqLocaleFieldsProps) {
  const direction = LOCALE_DIRECTION[locale];
  return (
    <div hidden={!active} aria-hidden={!active} className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className={fieldLabel}>Soru</span>
        <input
          name={`${locale}.question`}
          defaultValue={values?.question ?? ''}
          className={fieldInput}
          dir={direction}
          required={active}
        />
        {errors?.[`${locale}.question`] ? (
          <span className={fieldError}>{errors[`${locale}.question`]}</span>
        ) : null}
      </label>
      <div className="sm:col-span-2">
        <RichTextEditor
          name={`${locale}.answer`}
          defaultValue={values?.answer ?? ''}
          label="Cevap"
          dir={direction}
        />
        {errors?.[`${locale}.answer`] ? (
          <span className={fieldError}>{errors[`${locale}.answer`]}</span>
        ) : null}
      </div>
      <label>
        <span className={fieldLabel}>Kategori</span>
        <input
          name={`${locale}.category`}
          defaultValue={values?.category ?? ''}
          className={fieldInput}
          dir={direction}
        />
      </label>
    </div>
  );
}

export function FaqManager({ entries }: { entries: readonly FaqManagerEntry[] }) {
  const [activeLocale, setActiveLocale] = useState<Locale>('tr');
  const [category, setCategory] = useState('all');
  const [feedback, setFeedback] = useState<FaqActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = useMemo(() => {
    const values = new Set<string>();
    for (const entry of entries) {
      const value = entry.locales[activeLocale]?.category.trim();
      if (value) values.add(value);
    }
    return [...values].sort((left, right) => left.localeCompare(right, 'tr'));
  }, [activeLocale, entries]);

  const filteredEntries =
    category === 'all'
      ? entries
      : entries.filter((entry) => entry.locales[activeLocale]?.category === category);

  function runAction(action: () => Promise<FaqActionState>): void {
    startTransition(async () => setFeedback(await action()));
  }

  return (
    <div className="space-y-5" aria-busy={isPending}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div hidden={ADMIN_LOCALES.length <= 1} className={localeTabBar} role="tablist" aria-label="İçerik dili">
          {ADMIN_LOCALES.map((locale) => (
            <button
              key={locale}
              type="button"
              role="tab"
              aria-selected={activeLocale === locale}
              className={cn(localeTab, activeLocale === locale && localeTabActive)}
              onClick={() => {
                setActiveLocale(locale);
                setCategory('all');
              }}
            >
              {LOCALE_SHORT_LABELS[locale]}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Kategoriye göre filtrele</span>
          <SelectField
            className={fieldInput}
            value={category}
            onValueChange={setCategory}
            placeholder="Kategori seçin"
            options={[
              { value: 'all', label: 'Tüm kategoriler' },
              ...categories.map((value) => ({ value, label: value })),
            ]}
          />
        </label>
      </div>

      {feedback ? (
        <Toast
          message={feedback.ok ? (feedback.message ?? 'İşlem tamamlandı.') : feedback.error}
          tone={feedback.ok ? 'success' : 'error'}
        />
      ) : null}

      <form
        className={cardPadded}
        action={(formData) => runAction(() => createFaqAction(formData))}
      >
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-4 text-accent-primary" aria-hidden="true" />
          <h2 className={sectionTitle}>Yeni Soru Ekle</h2>
        </div>
        <label className="mb-4 block">
          <span className={fieldLabel}>Kayıt anahtarı</span>
          <input
            name="key"
            className={fieldInput}
            placeholder="ornek-soru"
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            required
          />
          <span className={helpText}>Küçük harf, rakam ve tire kullanın.</span>
        </label>
        {ADMIN_LOCALES.map((locale) => (
          <FaqLocaleFields
            key={locale}
            locale={locale}
            active={locale === activeLocale}
            errors={feedback && !feedback.ok ? feedback.fieldErrors : undefined}
          />
        ))}
        <div className="mt-4 flex justify-end">
          <button type="submit" className={primaryButton} disabled={isPending}>
            <Plus className="size-4" aria-hidden="true" />
            Soruyu ekle
          </button>
        </div>
      </form>

      {filteredEntries.length === 0 ? (
        <EmptyState
          icon={ChevronDown}
          title="Bu filtrede soru yok"
          description="Yeni bir soru ekleyin veya kategori filtresini değiştirin."
        />
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <form
              key={entry.id}
              className={cardPadded}
              action={(formData) => runAction(() => updateFaqAction(entry.id, formData))}
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className={sectionTitle}>
                    {entry.locales[activeLocale]?.question || 'Eksik soru metni'}
                  </h2>
                  <p className={`mt-1 ${helpText}`}>{entry.key}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={iconButton}
                    disabled={isPending || entries[0]?.id === entry.id}
                    onClick={() => runAction(() => moveFaqAction(entry.id, 'up'))}
                    aria-label="Yukarı taşı"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className={iconButton}
                    disabled={isPending || entries[entries.length - 1]?.id === entry.id}
                    onClick={() => runAction(() => moveFaqAction(entry.id, 'down'))}
                    aria-label="Aşağı taşı"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                  </button>
                  <ConfirmButton
                    type="button"
                    className={iconButton}
                    confirmText="Bu soru kalıcı olarak silinsin mi?"
                    onClick={() => runAction(() => deleteFaqAction(entry.id))}
                    aria-label="Soruyu sil"
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </ConfirmButton>
                </div>
              </div>

              <input type="hidden" name="key" value={entry.key} />
              {ADMIN_LOCALES.map((locale) => (
                <FaqLocaleFields
                  key={locale}
                  locale={locale}
                  values={entry.locales[locale]}
                  active={locale === activeLocale}
                  errors={feedback && !feedback.ok ? feedback.fieldErrors : undefined}
                />
              ))}
              <div className="mt-4 flex justify-end">
                <button type="submit" className={secondaryButton} disabled={isPending}>
                  <Save className="size-4" aria-hidden="true" />
                  Değişiklikleri kaydet
                </button>
              </div>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
