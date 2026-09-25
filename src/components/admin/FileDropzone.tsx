'use client';

import { FileText, Image as ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { cn, fieldHint, iconButton } from './ui';

type FileDropzoneProps = {
  name: string;
  accept: string;
  disabled?: boolean;
  required?: boolean;
  onChange?: (file: File | null) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function acceptHint(accept: string): string {
  return accept.includes('pdf')
    ? 'JPG, PNG, WebP, GIF, SVG veya PDF'
    : 'JPG, PNG, WebP, GIF veya SVG';
}

export function FileDropzone({
  name,
  accept,
  disabled = false,
  required = false,
  onChange,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;

    const reset = () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
      setPreviewUrl(null);
      setFile(null);
      setDragging(false);
      onChange?.(null);
    };
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [onChange]);

  function choose(nextFile: File | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const nextPreviewUrl =
      nextFile?.type.startsWith('image/') ? URL.createObjectURL(nextFile) : null;
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
    setFile(nextFile);
    onChange?.(nextFile);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    choose(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;

    const droppedFile = event.dataTransfer.files[0];
    if (!droppedFile || !inputRef.current) return;
    inputRef.current.files = event.dataTransfer.files;
    choose(droppedFile);
  }

  function clear() {
    if (inputRef.current) inputRef.current.value = '';
    choose(null);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        required={required}
        disabled={disabled}
        className="sr-only"
        onChange={handleInputChange}
      />
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        className={cn(
          'relative flex min-h-40 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-bg-surface p-6 text-center transition-colors focus:outline-none focus-visible:border-accent-primary',
          disabled && 'cursor-wait opacity-60',
          dragging ? 'border-accent-primary bg-accent-soft' : 'border-border-default hover:border-accent-primary',
        )}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex w-full items-center justify-center gap-4 text-start">
            {previewUrl ? (
              <span className="relative size-20 shrink-0 overflow-hidden rounded-md border border-border-default bg-bg-base">
                <Image
                  src={previewUrl}
                  alt="Seçilen dosya önizlemesi"
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </span>
            ) : (
              <span className="flex size-20 shrink-0 items-center justify-center rounded-md border border-border-default bg-bg-base">
                <FileText className="size-8 text-text-muted" aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-text-primary">{file.name}</span>
              <span className={`${fieldHint} mt-1`}>{formatBytes(file.size)}</span>
              <span className="mt-2 block text-xs font-bold text-accent-primary">Değiştirmek için tıklayın</span>
            </span>
            <button
              type="button"
              className={cn(iconButton, 'absolute end-2 top-2 bg-bg-base')}
              aria-label="Seçilen dosyayı temizle"
              onClick={(event) => {
                event.stopPropagation();
                clear();
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-accent-soft text-accent-primary">
              {dragging ? (
                <ImageIcon className="size-5" aria-hidden="true" />
              ) : (
                <Upload className="size-5" aria-hidden="true" />
              )}
            </span>
            <span className="text-sm font-bold text-text-primary">
              Dosyayı buraya sürükleyin veya seçmek için tıklayın
            </span>
            <span className={fieldHint}>{acceptHint(accept)}</span>
          </>
        )}
      </div>
    </div>
  );
}
