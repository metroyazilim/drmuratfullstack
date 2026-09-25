'use client';

import { ArrowDown, ArrowUp, ImagePlus, Images, Save, Trash2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { EmptyState } from '@/components/admin/EmptyState';
import { MediaField } from '@/components/admin/MediaField';
import { RowThumbnail } from '@/components/admin/RowThumbnail';
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
  LOCALE_LABELS,
  LOCALE_SHORT_LABELS,
  type Locale,
} from '@/lib/admin/locales';
import {
  createGalleryImageAction,
  deleteGalleryImageAction,
  moveGalleryImageAction,
  updateGalleryAltsAction,
  type GalleryActionState,
} from './actions';

export type GalleryManagerImage = {
  id: string;
  path: string;
  alts: Partial<Record<Locale, string>>;
};

type AltFieldsProps = {
  alts?: Partial<Record<Locale, string>>;
  activeLocale: Locale;
  errors?: Record<string, string>;
};

function AltFields({ alts, activeLocale, errors }: AltFieldsProps) {
  return (
    <>
      {ADMIN_LOCALES.map((locale) => (
        <label key={locale} hidden={locale !== activeLocale} aria-hidden={locale !== activeLocale}>
          <span className={fieldLabel}>{LOCALE_LABELS[locale]} alternatif metni</span>
          <input
            name={`${locale}.alt`}
            defaultValue={alts?.[locale] ?? ''}
            className={fieldInput}
            dir={LOCALE_DIRECTION[locale]}
            minLength={10}
            required={locale === activeLocale}
          />
          {errors?.[`${locale}.alt`] ? (
            <span className={fieldError}>{errors[`${locale}.alt`]}</span>
          ) : null}
        </label>
      ))}
    </>
  );
}

export function GalleryManager({ images }: { images: readonly GalleryManagerImage[] }) {
  const [activeLocale, setActiveLocale] = useState<Locale>('tr');
  const [feedback, setFeedback] = useState<GalleryActionState | null>(null);
  const [isPending, startTransition] = useTransition();

  function runAction(action: () => Promise<GalleryActionState>): void {
    startTransition(async () => setFeedback(await action()));
  }

  return (
    <div className="space-y-5" aria-busy={isPending}>
      <div hidden={ADMIN_LOCALES.length <= 1} className={localeTabBar} role="tablist" aria-label="Alternatif metin dili">
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

      {feedback ? (
        <Toast
          message={feedback.ok ? (feedback.message ?? 'İşlem tamamlandı.') : feedback.error}
          tone={feedback.ok ? 'success' : 'error'}
        />
      ) : null}

      <form
        className={cardPadded}
        action={(formData) => runAction(() => createGalleryImageAction(formData))}
      >
        <div className="mb-4 flex items-center gap-2">
          <ImagePlus className="size-4 text-accent-primary" aria-hidden="true" />
          <h2 className={sectionTitle}>Galeri Görseli Ekle</h2>
        </div>
        <MediaField
          name="path"
          label="Görsel"
          value=""
          hint="Medya kitaplığından bir görsel seçin."
          required
        />
        {feedback && !feedback.ok && feedback.fieldErrors?.path ? (
          <p className={fieldError}>{feedback.fieldErrors.path}</p>
        ) : null}
        <div className="mt-4">
          <AltFields
            activeLocale={activeLocale}
            errors={feedback && !feedback.ok ? feedback.fieldErrors : undefined}
          />
        </div>
        <p className={`mt-3 ${helpText}`}>
          Görsel eklenmeden önce dört dilde de açıklayıcı alternatif metin girilmelidir.
        </p>
        <div className="mt-4 flex justify-end">
          <button type="submit" className={primaryButton} disabled={isPending}>
            <ImagePlus className="size-4" aria-hidden="true" />
            Görseli ekle
          </button>
        </div>
      </form>

      {images.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Galeride görsel yok"
          description="Medya kitaplığından ilk galeri görselini ekleyin."
        />
      ) : (
        <div className="space-y-4">
          {images.map((image, index) => {
            const completedAltCount = ADMIN_LOCALES.filter(
              (locale) => image.alts[locale]?.trim(),
            ).length;
            const hasMissingAlt = completedAltCount !== ADMIN_LOCALES.length;
            return (
              <form
                key={image.id}
                className={cardPadded}
                action={(formData) =>
                  runAction(() => updateGalleryAltsAction(image.id, formData))
                }
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <RowThumbnail
                      src={image.path}
                      alt={image.alts[activeLocale] || 'Galeri görseli önizlemesi'}
                    />
                    <div className="min-w-0">
                      <h2 className={sectionTitle}>Galeri görseli {index + 1}</h2>
                      <p className={`mt-1 truncate ${helpText}`}>{image.path}</p>
                      {hasMissingAlt ? (
                        <span className="mt-2 inline-flex rounded-md bg-state-error/10 px-2 py-1 text-xs font-semibold text-state-error">
                          Alt metin eksik: {completedAltCount}/4 dil
                        </span>
                      ) : (
                        <span className="mt-2 inline-flex rounded-md bg-state-success/10 px-2 py-1 text-xs font-semibold text-state-success">
                          Alt metinler tamamlandı
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={iconButton}
                      disabled={isPending || index === 0}
                      onClick={() => runAction(() => moveGalleryImageAction(image.id, 'up'))}
                      aria-label="Yukarı taşı"
                    >
                      <ArrowUp className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={iconButton}
                      disabled={isPending || index === images.length - 1}
                      onClick={() => runAction(() => moveGalleryImageAction(image.id, 'down'))}
                      aria-label="Aşağı taşı"
                    >
                      <ArrowDown className="size-4" aria-hidden="true" />
                    </button>
                    <ConfirmButton
                      type="button"
                      className={iconButton}
                      confirmText="Bu görsel galeriden kalıcı olarak silinsin mi?"
                      onClick={() => runAction(() => deleteGalleryImageAction(image.id))}
                      aria-label="Görseli sil"
                      disabled={isPending}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </ConfirmButton>
                  </div>
                </div>

                <AltFields
                  alts={image.alts}
                  activeLocale={activeLocale}
                  errors={feedback && !feedback.ok ? feedback.fieldErrors : undefined}
                />
                <div className="mt-4 flex justify-end">
                  <button type="submit" className={secondaryButton} disabled={isPending}>
                    <Save className="size-4" aria-hidden="true" />
                    Alternatif metinleri kaydet
                  </button>
                </div>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}
