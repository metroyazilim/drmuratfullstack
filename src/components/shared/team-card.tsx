import Image from 'next/image';
import { Link } from '@/lib/i18n';
import { Monogram } from './monogram';
import type { TeamSummary } from '@/lib/content/types';

export function TeamCard({ member }: { member: TeamSummary }) {
  return (
    <Link
      href={{ pathname: '/team/[slug]', params: { slug: member.slug } }}
      className="border-border-default hover:border-accent-primary focus-visible:ring-accent-primary block overflow-hidden rounded-lg border transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <div className="relative h-72">
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.photoAlt ?? member.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <Monogram name={member.name} className="h-full w-full" />
        )}
      </div>

      <div className="border-border-default border-t p-5 text-center">
        <h3 className="text-text-primary text-base font-semibold">
          {member.name}
        </h3>
        <p className="text-text-muted mt-1 text-xs">{member.role}</p>
      </div>
    </Link>
  );
}
