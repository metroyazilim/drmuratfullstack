import { Mail, Phone } from 'lucide-react';
import { getClinic } from '@/lib/content';
import { Container } from '@/components/ui/container';

/** Koyu üst şerit — md altında gizlidir (tasarım gereği). */
export function TopBar() {
  const clinic = getClinic();

  return (
    <div className="bg-bg-inverse text-text-inverse hidden md:block">
      <Container>
        <div className="flex h-9 items-center justify-between text-xs">
          <p className="text-text-inverse/70">{clinic.slogan}</p>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${clinic.contact.phone}`}
              className="hover:text-accent-primary inline-flex items-center gap-1.5 transition-colors"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <bdi>{clinic.contact.phoneFormatted}</bdi>
            </a>
            <a
              href={`mailto:${clinic.contact.email}`}
              className="hover:text-accent-primary inline-flex items-center gap-1.5 transition-colors"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{clinic.contact.email}</span>
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
