'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Tek IntersectionObserver, tüm `[data-reveal]` blokları için.
 *
 * Her blok için ayrı client bileşeni yerine tek gözlemci: bundle küçük
 * kalır ve `Reveal` server component olarak kalabilir.
 *
 * `pathname` bağımlılığı ŞART: layout gezinmeler arasında ayakta kaldığı
 * için efekt yalnızca ilk yüklemede çalışsaydı, tıklanarak açılan
 * sayfaların blokları hiç gözlemlenmez ve `opacity: 0`'da takılı kalırdı —
 * yani sayfa bomboş görünürdü.
 */
export function MotionProvider() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;

    // Hareketi azalt tercihi varsa hiç başlatma: bloklar zaten görünür.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    root.dataset.motion = 'on';

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealed = 'true';
          observer.unobserve(entry.target);
        }
      },
      // Blok görüş alanına biraz girince tetiklenir; alt kenardan 80px
      // önce başlatmak, kullanıcı oraya varmadan animasyonun bitmesini sağlar.
      { rootMargin: '0px 0px -80px 0px', threshold: 0.05 },
    );

    const targets = document.querySelectorAll('[data-reveal]');
    for (const el of targets) {
      // İlk ekranda zaten görünen bloklar beklemez.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        (el as HTMLElement).dataset.revealed = 'true';
        continue;
      }
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
