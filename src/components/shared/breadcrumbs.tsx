import { getTranslations } from '@/lib/strings';
import { Link } from '@/lib/site-routes';
import { cn } from '@/lib/utils/cn';

export type Crumb = {
  name: string;
  /** Mutlak URL — JSON-LD ile aynı diziden gelir. */
  url: string;
  href?: Parameters<typeof Link>[0]['href'];
};

type BreadcrumbsProps = {
  items: Crumb[];
  inverse?: boolean;
};

/**
 * Ekrandaki breadcrumb ile SPEC-004'ün breadcrumbSchema'sı AYNI diziden
 * beslenir; ikisi ayrışamaz.
 */
export async function Breadcrumbs({ items, inverse = false }: BreadcrumbsProps) {
  const t = await getTranslations('a11y');

  return (
    <nav aria-label={t('breadcrumb')}>
      <ol
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm',
          inverse ? 'text-text-inverse/70' : 'text-text-muted',
        )}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={item.url} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {isLast || !item.href ? (
                <span
                  aria-current="page"
                  className={inverse ? 'text-text-inverse' : 'text-text-primary'}
                >
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-accent-primary transition-colors">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
