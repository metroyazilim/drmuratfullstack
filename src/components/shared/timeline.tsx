import { RichText } from '@/components/RichText';

import type { PageFrontmatter } from '@/lib/content/types';

type TimelineProps = NonNullable<PageFrontmatter['timeline']>;

/**
 * "Eğitimden klinik pratiğe" bloğu.
 * Etiket → açıklama eşlemesi olduğu için <dl>; tablo değil.
 */
export function Timeline({ rows }: Pick<TimelineProps, 'rows'>) {
  return (
    <dl className="mt-8">
      {rows.map((row) => (
        <div
          key={row.label}
          className="border-border-default grid gap-1 border-b py-5 sm:grid-cols-[10rem_1fr] sm:gap-6"
        >
          <dt className="text-accent-primary text-base font-bold">
            {row.label}
          </dt>
          <dd>
            <RichText
              html={row.description}
              className="text-text-muted text-sm leading-relaxed"
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
