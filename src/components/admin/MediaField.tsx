'use client';

import { Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { useId, useState, type ChangeEvent } from 'react';
import { fieldError, fieldHint, fieldInput, fieldLabel, secondaryButton } from './ui';
import { MediaPickerModal } from './MediaPickerModal';
import { uploadMediaAction } from '@/app/manage/(panel)/medya/actions';

export type MediaFieldProps = {
  name: string;
  label: string;
  value: string;
  hint?: string;
  required?: boolean;
  onChange?: (value: string) => void;
};

export function MediaField({
  name,
  label,
  value,
  hint,
  required,
  onChange,
}: MediaFieldProps) {
  const inputId = useId();
  const [internalValue, setInternalValue] = useState(value);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentValue = onChange ? value : internalValue;

  function updateValue(nextValue: string) {
    if (!onChange) setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set('file', file);
    formData.set('altText', '');
    formData.set('caption', '');
    const result = await uploadMediaAction(formData);
    setUploading(false);
    event.target.value = '';

    if (!result.ok) {
      setError(result.error);
      return;
    }
    updateValue(result.asset.url);
  }

  return (
    <div>
      <label htmlFor={inputId} className={fieldLabel}>
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        value={currentValue}
        required={required}
        onChange={(event) => updateValue(event.target.value)}
        placeholder="/images/... veya https://..."
        className={fieldInput}
      />

      {currentValue ? (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border-default bg-bg-surface p-3 sm:flex-row sm:items-center">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-md border border-border-default bg-bg-base sm:w-36">
            <Image
              src={currentValue}
              alt={`${label} önizlemesi`}
              fill
              sizes="144px"
              className="object-cover"
              unoptimized
            />
          </div>
          <p className="min-w-0 flex-1 truncate text-xs text-text-muted" title={currentValue}>
            {currentValue}
          </p>
          <button
            type="button"
            onClick={() => updateValue('')}
            className={secondaryButton}
            aria-label={`${label} seçimini kaldır`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Kaldır
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border-default bg-bg-surface p-4 text-xs text-text-muted">
          <ImageIcon className="size-5" aria-hidden="true" />
          Henüz medya seçilmedi.
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setModalOpen(true)} className={secondaryButton}>
          <ImageIcon className="size-4" aria-hidden="true" />
          Kitaplıktan seç
        </button>
        <label className={secondaryButton}>
          {uploading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Upload className="size-4" aria-hidden="true" />
          )}
          {uploading ? 'Yükleniyor…' : 'Yükle'}
          <input
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            disabled={uploading}
            onChange={upload}
          />
        </label>
      </div>

      {hint ? <p className={fieldHint}>{hint}</p> : null}
      {error ? (
        <p className={fieldError} role="alert">
          {error}
        </p>
      ) : null}

      <MediaPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(url) => {
          updateValue(url);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
