'use client';

import { Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { WhatsAppIcon } from './whatsapp-icon';

type FloatingActionsProps = {
  phone: string;
  whatsapp: string;
};

/**
 * Her sayfada, her breakpoint'te erişilebilir iki aksiyon.
 * Yazdırmada gizlenir; mobilde alt güvenli alanın üzerinde durur.
 */
export function FloatingActions({ phone, whatsapp }: FloatingActionsProps) {
  const t = useTranslations('a11y');
  const tWhatsapp = useTranslations('whatsapp');

  const waHref = `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    tWhatsapp('message'),
  )}`;

  return (
    <div className="fixed end-4 bottom-4 z-30 flex flex-col gap-3 pb-[env(safe-area-inset-bottom)] print:hidden md:end-6 md:bottom-6">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('whatsapp')}
        className="bg-brand-whatsapp hover:bg-brand-whatsapp-hover focus-visible:ring-accent-primary flex h-13 w-13 items-center justify-center rounded-full text-white shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <WhatsAppIcon className="h-6 w-6" />
      </a>

      <a
        href={`tel:${phone}`}
        aria-label={t('phone')}
        className="bg-accent-primary hover:bg-accent-hover focus-visible:ring-accent-primary text-text-inverse flex h-13 w-13 items-center justify-center rounded-full shadow-lg transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
      >
        <Phone className="h-5 w-5" aria-hidden="true" />
      </a>
    </div>
  );
}
