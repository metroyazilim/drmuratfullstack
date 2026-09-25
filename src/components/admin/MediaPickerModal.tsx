'use client';

import { ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { FileDropzone } from '@/components/admin/FileDropzone';
import {
  fieldError,
  fieldHint,
  secondaryButton,
} from '@/components/admin/ui';
import { listMediaForPickerAction, uploadMediaAction } from '@/app/manage/(panel)/medya/actions';
import type { MediaAssetDto } from '@/lib/media/types';

export type MediaPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [assets, setAssets] = useState<MediaAssetDto[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    // Var olan ızgara istek sürerken görünür kalır; sayfa değişimleri
    // yükleme durumunu tıklama anında etkinleştirir.

    void listMediaForPickerAction(page).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setError(result.error);
      } else {
        setAssets(result.assets);
        setTotal(result.total);
        setPageSize(result.pageSize);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [open, page, reloadToken]);

  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    window.addEventListener('keydown', closeWithEscape);
    return () => {
      window.removeEventListener('keydown', closeWithEscape);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, onClose]);

  async function upload(file: File) {

    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.set('file', file);
    formData.set('altText', '');
    formData.set('caption', '');
    const result = await uploadMediaAction(formData);
    setUploading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSelect(result.asset.url);
    onClose();
    setReloadToken((current) => current + 1);
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  if (!open || typeof document === 'undefined') return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg-inverse/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
      onMouseDown={closeFromBackdrop}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex max-h-screen w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border-default bg-bg-base shadow-xl outline-none"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-default px-5 py-4">
          <div>
            <h2 id="media-picker-title" className="text-base font-bold text-text-primary">
              Medya kitaplığından seç
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              Kayıtlı bir görsel seçin veya yeni bir görsel yükleyin.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-text-muted hover:bg-bg-surface hover:text-text-primary"
            aria-label="Medya seçiciyi kapat"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <section className="min-h-0 flex-1 overflow-y-auto p-5" aria-label="Medya kitaplığı">
          <div className="mb-4">
            <FileDropzone
              name="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
              disabled={uploading}
              onChange={(file) => {
                if (file) void upload(file);
              }}
            />
            {uploading ? (
              <p className="mt-2 flex items-center gap-2 text-xs font-bold text-accent-primary" role="status">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Görsel yükleniyor…
              </p>
            ) : null}
          </div>

          {error ? (
            <p className={fieldError} role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-text-muted" role="status">
              <Loader2 className="me-2 size-5 animate-spin" aria-hidden="true" />
              Görseller yükleniyor…
            </div>
          ) : assets.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border-default p-8 text-center">
              <ImageIcon className="mb-3 size-9 text-text-muted" aria-hidden="true" />
              <p className="text-sm font-bold text-text-primary">Henüz görsel yok</p>
              <p className="mt-1 text-xs text-text-muted">İlk görseli yükleyerek başlayın.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset.url);
                    onClose();
                  }}
                  className="overflow-hidden rounded-lg border border-border-default bg-bg-base text-start transition-colors hover:border-accent-primary focus:border-accent-primary focus:outline-none"
                >
                  <span className="relative block aspect-square overflow-hidden bg-bg-surface">
                    <Image
                      src={asset.url}
                      alt={asset.altText || asset.filename}
                      fill
                      sizes="(max-width: 640px) 50vw, 12rem"
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                  <span className="block p-2.5">
                    <span className="block truncate text-xs font-bold text-text-primary">
                      {asset.filename}
                    </span>
                    <span className="mt-1 block text-xs text-text-muted">
                      {formatBytes(asset.byteSize)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-5 py-3">
          <p className={fieldHint}>
            Sayfa {page} / {pageCount} · {total} görsel
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className={secondaryButton}
              disabled={page <= 1 || loading}
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.max(1, current - 1));
              }}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Önceki
            </button>
            <button
              type="button"
              className={secondaryButton}
              disabled={page >= pageCount || loading}
              onClick={() => {
                setLoading(true);
                setPage((current) => Math.min(pageCount, current + 1));
              }}
            >
              Sonraki
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
