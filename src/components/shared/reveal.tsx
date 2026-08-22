import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type Direction = 'up' | 'down' | 'left' | 'right' | 'fade';

type RevealProps = {
  children: ReactNode;
  direction?: Direction;
  /** Sıralı kartlarda kademe (ms). Aynı satırdaki kartlar peş peşe gelir. */
  delay?: number;
  className?: string;
};

/**
 * Kaydırma ile beliren blok.
 *
 * SERVER COMPONENT: yalnızca veri niteliği basar, JS bundle'a hiçbir şey
 * eklemez. Gözlem işini layout'taki tek `MotionProvider` yapar.
 *
 * Güvenlik ağı: başlangıç (gizli) durumu CSS'te yalnızca
 * `html[data-motion="on"]` altında geçerli. Bu nitelik, boyamadan önce
 * çalışan küçük bir script ile ekleniyor — yani JS kapalıysa nitelik hiç
 * eklenmez ve içerik TAM GÖRÜNÜR kalır. Animasyon yalnızca `transform` ve
 * `opacity` kullanır; düzen değişmediği için CLS'e dokunmaz.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
}: RevealProps) {
  return (
    <div
      data-reveal={direction}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </div>
  );
}
