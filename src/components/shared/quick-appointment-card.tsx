import { Mail, Phone } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getClinic } from '@/lib/content';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/i18n';

/** Detay sayfalarının sidebar'ında; SPEC-008'de blog detayında da kullanılır. */
export async function QuickAppointmentCard() {
  const t = await getTranslations('service');
  const clinic = getClinic();

  return (
    <div className="border-border-default rounded-lg border p-5">
      <h2 className="text-text-primary text-base font-semibold">
        {t('quickAppointment')}
      </h2>

      <ul className="border-border-default mt-4 space-y-3 border-b pb-4 text-sm">
        <li>
          <a
            href={`tel:${clinic.contact.phone}`}
            className="text-text-muted hover:text-accent-primary inline-flex items-center gap-2 transition-colors"
          >
            <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
            <bdi>{clinic.contact.phoneFormatted}</bdi>
          </a>
        </li>
        <li>
          <a
            href={`mailto:${clinic.contact.email}`}
            className="text-text-muted hover:text-accent-primary inline-flex items-center gap-2 transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{clinic.contact.email}</span>
          </a>
        </li>
      </ul>

      <Link href="/appointment" className="mt-4 block">
        <Button variant="primary" className="w-full">
          {t('appointmentCta')}
        </Button>
      </Link>
    </div>
  );
}
