'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { Play, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { VideoItem } from '@/lib/content/types';

/**
 * YouTube facade: karo yalnızca YEREL kapak görselini gösterir.
 * iframe ancak tıklandıktan sonra ve youtube-nocookie üzerinden yüklenir —
 * böylece sayfa açılışında YouTube'a hiçbir istek gitmez ve üçüncü parti
 * çerez düşmez (project-overview.md gereği).
 */
export function VideoGrid({ videos }: { videos: VideoItem[] }) {
  const [active, setActive] = useState<VideoItem | null>(null);
  const t = useTranslations('video');

  return (
    <>
      <ul className="mt-10 grid gap-6 md:grid-cols-2">
        {videos.map((video) => (
          <li key={video.id}>
            <button
              type="button"
              onClick={() => setActive(video)}
              aria-label={`${t('play')}: ${video.title}`}
              className="group focus-visible:ring-accent-primary relative block h-64 w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 md:h-72"
            >
              <Image
                src={video.coverImage}
                alt={video.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <span className="bg-bg-base text-accent-primary absolute top-1/2 start-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full rtl:translate-x-1/2">
                <Play className="h-6 w-6 ps-0.5 rtl:rotate-180" aria-hidden="true" />
              </span>
              <span className="text-text-inverse absolute bottom-4 start-5 text-sm font-semibold">
                {video.title}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog.Root
        open={active !== null}
        onOpenChange={(open) => !open && setActive(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/80" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Dialog.Title className="sr-only">{active?.title ?? ''}</Dialog.Title>

            {active && (
              <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-lg bg-black">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
                  title={active.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            )}

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
