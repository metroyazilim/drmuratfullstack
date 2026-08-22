import { getTranslations } from 'next-intl/server';
import { Link } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';
import type { PostSummary } from '@/lib/content/types';

type RecentPostsSidebarProps = {
  posts: PostSummary[];
  activeId?: string;
};

export async function RecentPostsSidebar({
  posts,
  activeId,
}: RecentPostsSidebarProps) {
  const t = await getTranslations('blog');

  if (posts.length === 0) return null;

  return (
    <nav
      className="border-border-default rounded-lg border p-5"
      aria-label={t('recentPosts')}
    >
      <h2 className="text-text-primary text-base font-semibold">
        {t('recentPosts')}
      </h2>
      <ul className="mt-4">
        {posts.map((post) => {
          const isActive = post.id === activeId;

          return (
            <li
              key={post.id}
              className="border-border-default border-b last:border-b-0"
            >
              <Link
                href={{ pathname: '/blog/[slug]', params: { slug: post.slug } }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'block py-2.5 text-sm leading-snug transition-colors',
                  isActive
                    ? 'text-accent-primary font-semibold'
                    : 'text-text-muted hover:text-accent-primary',
                )}
              >
                {post.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
