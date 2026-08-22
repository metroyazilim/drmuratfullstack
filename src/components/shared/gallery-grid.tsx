'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';
import type { GalleryItem } from '@/lib/content/types';

type GalleryGridProps = {
  items: (GalleryItem & { label?: string; span?: 'wide' | 'tall' })[];
};

/**
 * Tek bir dialog örneği kullanılır; her karo için ayrı modal render edilmez.
 * Odak tuzağı, Esc ve scroll kilidi Radix'ten gelir.
 */
export function GalleryGrid({ items }: GalleryGridProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const t = useTranslations('gallery');

  const current = openIndex === null ? null : items[openIndex];

  const go = useCallback(
    (delta: number) => {
      setOpenIndex((index) =>
        index === null ? null : (index + delta + items.length) % items.length,
      );
    },
    [items.length],
  );

  return (
    <>
      <ul className="mt-10 grid auto-rows-[13rem] grid-cols-2 gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <li
            key={item.image}
            className={cn(
              item.span === 'wide' && 'md:col-span-2',
              item.span === 'tall' && 'row-span-2',
            )}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group focus-visible:ring-accent-primary relative h-full w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {item.label && (
                <span className="bg-bg-base text-text-primary absolute bottom-3 start-3 rounded-md px-2.5 py-1 text-xs font-medium">
                  {item.label}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onKeyDown={(event) => {
              // RTL'de ok tuşları görsel yönle uyumlu kalsın diye yön
              // dokümanın dir'ine göre çevrilir.
              const rtl = document.documentElement.dir === 'rtl';
              if (event.key === 'ArrowRight') go(rtl ? -1 : 1);
              if (event.key === 'ArrowLeft') go(rtl ? 1 : -1);
            }}
          >
            <Dialog.Title className="sr-only">{current?.alt ?? ''}</Dialog.Title>

            {current && (
              <div className="relative h-[80vh] w-full max-w-4xl">
                <Image
                  src={current.image}
                  alt={current.alt}
                  fill
                  sizes="90vw"
                  className="object-contain"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t('previous')}
              className="absolute start-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t('next')}
              className="absolute end-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-black"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
            </button>

            <Dialog.Close
              aria-label={t('close')}
              className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
