import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import type { ServiceSummary } from '@/lib/content/types';

type ServiceSidebarProps = {
  services: ServiceSummary[];
  activeId: string;
};

export async function ServiceSidebar({
  services,
  activeId,
}: ServiceSidebarProps) {
  const t = await getTranslations('service');

  return (
    <nav className="border-border-default rounded-lg border p-5" aria-label={t('allServices')}>
      <h2 className="text-text-primary text-base font-semibold">
        {t('allServices')}
      </h2>
      <ul className="mt-4">
        {services.map((service) => {
          const isActive = service.id === activeId;

          return (
            <li key={service.id} className="border-border-default border-b last:border-b-0">
              <Link
                href={{ pathname: '/services/[slug]', params: { slug: service.slug } }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'block py-2.5 text-sm transition-colors',
                  isActive
                    ? 'text-accent-primary font-semibold'
                    : 'text-text-muted hover:text-accent-primary',
                )}
              >
                {service.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
