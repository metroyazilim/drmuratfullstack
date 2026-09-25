'use client';

import {
  Archive,
  Clipboard,
  FileText,
  Image as ImageIcon,
  Loader2,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { EmptyState } from '@/components/admin/EmptyState';
import { FileDropzone } from '@/components/admin/FileDropzone';
import { Pagination } from '@/components/admin/Pagination';
import {
  card,
  cardPadded,
  fieldError,
  fieldInput,
  fieldLabel,
  fieldSuccess,
  fieldTextarea,
  helpText,
  primaryButton,
  secondaryButton,
  sectionTitle,
} from '@/components/admin/ui';
import type { MediaAssetDto, MediaKind } from '@/lib/media/types';
import {
  archiveMediaAssetAction,
  deleteMediaAssetAction,
  updateMediaMetadataAction,
  uploadMediaAction,
  type MediaActionResult,
} from './actions';

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function AssetCard({ asset }: { asset: MediaAssetDto }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<MediaActionResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const nextResult = await updateMediaMetadataAction(asset.id, formData);
      setResult(nextResult);
      if (nextResult.ok) router.refresh();
    });
  }

  function changeArchiveState() {
    if (!window.confirm(asset.archived ? 'Medyayı arşivden çıkarmak istiyor musunuz?' : 'Medyayı arşivlemek istiyor musunuz?')) {
      return;
    }
    startTransition(async () => {
      const nextResult = await archiveMediaAssetAction(asset.id, !asset.archived);
      setResult(nextResult);
      if (nextResult.ok) router.refresh();
    });
  }

  function permanentlyDelete() {
    if (!window.confirm('Bu medya kalıcı olarak silinecek. Bu işlem geri alınamaz.')) return;
    startTransition(async () => {
      const nextResult = await deleteMediaAssetAction(asset.id);
      setResult(nextResult);
      if (nextResult.ok) router.refresh();
    });
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setResult({ ok: false, error: 'URL panoya kopyalanamadı.' });
    }
  }

  return (
    <article className={`${card} overflow-hidden`}>
      <a
        href={asset.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex aspect-video items-center justify-center overflow-hidden bg-bg-surface"
      >
        {asset.kind === 'IMAGE' ? (
          <Image
            src={asset.url}
            alt={asset.altText || asset.filename}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-contain"
            unoptimized
          />
        ) : (
          <FileText className="size-14 text-text-muted" aria-hidden="true" />
        )}
      </a>

      <div className="border-t border-border-default p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold text-text-primary" title={asset.filename}>
              {asset.filename}
            </h2>
            <p className={`${helpText} mt-1`}>
              {asset.width && asset.height ? `${asset.width} × ${asset.height}px · ` : ''}
              {formatBytes(asset.byteSize)}
            </p>
          </div>
          {asset.kind === 'IMAGE' ? (
            <ImageIcon className="size-4 shrink-0 text-text-muted" aria-label="Görsel" />
          ) : (
            <FileText className="size-4 shrink-0 text-text-muted" aria-label="Belge" />
          )}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input readOnly value={asset.url} className={`${fieldInput} mt-0 min-w-0`} />
          <button type="button" onClick={copyUrl} className={secondaryButton}>
            <Clipboard className="size-4" aria-hidden="true" />
            {copied ? 'Kopyalandı' : 'URL kopyala'}
          </button>
        </div>

        <form onSubmit={saveMetadata} className="mt-4 space-y-3">
          <label className={fieldLabel}>
            Alternatif metin
            <input
              name="altText"
              defaultValue={asset.altText ?? ''}
              maxLength={500}
              className={fieldInput}
            />
          </label>
          <label className={fieldLabel}>
            Başlık / açıklama
            <textarea
              name="caption"
              defaultValue={asset.caption ?? ''}
              maxLength={2_000}
              rows={2}
              className={fieldTextarea}
            />
          </label>
          <button type="submit" disabled={pending} className={secondaryButton}>
            <Save className="size-4" aria-hidden="true" />
            Bilgileri kaydet
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-border-default pt-4">
          <button
            type="button"
            onClick={changeArchiveState}
            disabled={pending}
            className={secondaryButton}
          >
            {asset.archived ? (
              <RotateCcw className="size-4" aria-hidden="true" />
            ) : (
              <Archive className="size-4" aria-hidden="true" />
            )}
            {asset.archived ? 'Arşivden çıkar' : 'Arşivle'}
          </button>
          {asset.archived ? (
            <button
              type="button"
              onClick={permanentlyDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider text-state-error hover:bg-state-error/10 disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Kalıcı sil
            </button>
          ) : null}
        </div>

        {result ? (
          <p className={result.ok ? fieldSuccess : fieldError} role="status">
            {result.ok ? result.message : result.error}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function MediaLibraryView({
  assets,
  page,
  pageSize,
  total,
  kind,
  archived,
}: {
  assets: readonly MediaAssetDto[];
  page: number;
  pageSize: number;
  total: number;
  kind?: MediaKind;
  archived: boolean;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<MediaActionResult | null>(null);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploading(true);
    setUploadResult(null);
    const form = event.currentTarget;
    const result = await uploadMediaAction(new FormData(form));
    setUploading(false);
    setUploadResult(result);
    if (result.ok) {
      form.reset();
      router.refresh();
    }
  }

  const filterQuery = {
    ...(kind ? { kind: kind.toLowerCase() } : {}),
    ...(archived ? { archived: '1' } : {}),
  };
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <section className={cardPadded}>
        <h2 className={sectionTitle}>Dosya yükle</h2>
        <p className={`${helpText} mt-1`}>
          JPG, PNG, WebP, GIF, SVG veya PDF yükleyebilirsiniz.
        </p>
        <form onSubmit={upload} className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-3">
            <span className={fieldLabel}>Dosya</span>
            <div className="mt-1.5">
              <FileDropzone
                name="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.pdf"
                required
                disabled={uploading}
              />
            </div>
          </div>
          <label className={fieldLabel}>
            Alternatif metin
            <input name="altText" maxLength={500} className={fieldInput} />
          </label>
          <label className={fieldLabel}>
            Başlık / açıklama
            <input name="caption" maxLength={2_000} className={fieldInput} />
          </label>
          <div className="lg:col-span-3">
            <button type="submit" disabled={uploading} className={primaryButton}>
              {uploading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Upload className="size-4" aria-hidden="true" />
              )}
              {uploading ? 'Yükleniyor…' : 'Yükle'}
            </button>
            {uploadResult ? (
              <p className={uploadResult.ok ? fieldSuccess : fieldError} role="status">
                {uploadResult.ok ? uploadResult.message : uploadResult.error}
              </p>
            ) : null}
          </div>
        </form>
      </section>

      <nav className="flex flex-wrap gap-2" aria-label="Medya filtreleri">
        <Link href="/manage/medya" className={!kind && !archived ? primaryButton : secondaryButton}>
          Tüm görseller
        </Link>
        <Link href="/manage/medya?kind=image" className={kind === 'IMAGE' && !archived ? primaryButton : secondaryButton}>
          Görseller
        </Link>
        <Link href="/manage/medya?kind=document" className={kind === 'DOCUMENT' && !archived ? primaryButton : secondaryButton}>
          Belgeler
        </Link>
        <Link href="/manage/medya?archived=1" className={archived ? primaryButton : secondaryButton}>
          Arşiv
        </Link>
      </nav>

      {assets.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Medya bulunamadı"
          description="Seçili filtreye uygun bir dosya yok."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/manage/medya"
        query={filterQuery}
      />
    </div>
  );
}
