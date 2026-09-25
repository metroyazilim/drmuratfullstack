'use client';

import { Save } from 'lucide-react';
import { useActionState, useState } from 'react';
import { MediaField } from '@/components/admin/MediaField';
import { RichTextEditor } from '@/components/admin/RichTextEditor';
import { SelectField } from '@/components/ui/select-field';
import { Toast } from '@/components/admin/Toast';
import {
  cardPadded,
  cn,
  fieldError,
  fieldInput,
  fieldLabel,
  fieldTextarea,
  helpText,
  localeTab,
  localeTabActive,
  localeTabBar,
  primaryButton,
  sectionTitle,
} from '@/components/admin/ui';
import {
  HOME_ICON_LABELS,
  HOME_ICON_OPTIONS,
  HOME_SECTIONS,
  getStructuredValue,
  type StructuredField,
} from '@/lib/admin/structured-content';
import {
  ADMIN_LOCALES,
  LOCALE_DIRECTION,
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  type Locale,
} from '@/lib/admin/locales';
import { saveHomeAction } from './actions';

type HomeEditorProps = {
  initialContent: Partial<Record<Locale, unknown>>;
};

function StructuredInput({
  field,
  content,
  locale,
  error,
}: {
  field: StructuredField;
  content: unknown;
  locale: Locale;
  error?: string;
}) {
  const value = getStructuredValue(content, field.path);
  const direction = LOCALE_DIRECTION[locale];

  if (field.kind === 'media') {
    return (
      <div className="sm:col-span-2">
        <MediaField
          name={field.path}
          label={field.label}
          value={value}
          hint={field.hint}
          required
        />
        {error ? <p className={fieldError}>{error}</p> : null}
      </div>
    );
  }
  if (field.kind === 'richtext') {
    return (
      <div className="sm:col-span-2">
        <RichTextEditor
          name={field.path}
          defaultValue={value}
          label={field.label}
          dir={direction}
        />
        {field.hint ? <span className={helpText}>{field.hint}</span> : null}
        {error ? <span className={fieldError}>{error}</span> : null}
      </div>
    );
  }


  return (
    <label className={field.kind === 'textarea' ? 'sm:col-span-2' : undefined}>
      <span className={fieldLabel}>{field.label}</span>
      {field.kind === 'icon' ? (
        <SelectField
          name={field.path}
          defaultValue={value}
          placeholder="İkon seçin"
          className={fieldInput}
          options={HOME_ICON_OPTIONS.map((icon) => ({ value: icon, label: HOME_ICON_LABELS[icon] }))}
        />
      ) : field.kind === 'textarea' ? (
        <textarea
          name={field.path}
          defaultValue={value}
          className={fieldTextarea}
          dir={direction}
          rows={4}
          required
        />
      ) : (
        <input
          name={field.path}
          defaultValue={value}
          className={fieldInput}
          dir={direction}
          required
        />
      )}
      {field.hint ? <span className={helpText}>{field.hint}</span> : null}
      {error ? <span className={fieldError}>{error}</span> : null}
    </label>
  );
}

export function HomeEditor({ initialContent }: HomeEditorProps) {
  const [activeLocale, setActiveLocale] = useState<Locale>('tr');
  const [state, formAction, isPending] = useActionState(saveHomeAction, null);

  return (
    <div className="space-y-5">
      <div hidden={ADMIN_LOCALES.length <= 1} className={localeTabBar} role="tablist" aria-label="İçerik dili">
        {ADMIN_LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={activeLocale === locale}
            className={cn(localeTab, activeLocale === locale && localeTabActive)}
            onClick={() => setActiveLocale(locale)}
          >
            {LOCALE_SHORT_LABELS[locale]}
          </button>
        ))}
      </div>

      {state ? (
        <Toast
          message={state.ok ? (state.message ?? 'Değişiklikler kaydedildi.') : state.error}
          tone={state.ok ? 'success' : 'error'}
        />
      ) : null}

      {ADMIN_LOCALES.map((locale) => {
        const content = initialContent[locale];
        const isActive = activeLocale === locale;
        return (
          <form
            key={locale}
            action={formAction}
            hidden={!isActive}
            aria-hidden={!isActive}
            className="space-y-5"
          >
            <input type="hidden" name="locale" value={locale} />
            <p className={helpText}>
              {LOCALE_LABELS[locale]} anasayfa sürümünü düzenliyorsunuz.
            </p>

            {HOME_SECTIONS.map((section) => (
              <section key={section.id} className={cardPadded}>
                <div className="mb-4">
                  <h2 className={sectionTitle}>{section.label}</h2>
                  {section.description ? (
                    <p className={`mt-1 ${helpText}`}>{section.description}</p>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.fields.map((field) => (
                    <StructuredInput
                      key={field.path}
                      field={field}
                      content={content}
                      locale={locale}
                      error={state && !state.ok ? state.fieldErrors?.[field.path] : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}

            <div className="flex justify-end">
              <button type="submit" className={primaryButton} disabled={isPending}>
                <Save className="size-4" aria-hidden="true" />
                {isPending ? 'Kaydediliyor' : `${LOCALE_LABELS[locale]} sürümünü kaydet`}
              </button>
            </div>
          </form>
        );
      })}
    </div>
  );
}
