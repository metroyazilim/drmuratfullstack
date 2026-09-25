import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from '@/lib/strings';
import { Link } from '@/lib/site-routes';
import type { PostSummary } from '@/lib/content/types';

type PostCardProps = {
  post: PostSummary;
};

/** SPEC-008'de blog listesinde yeniden kullanılır. */
export async function PostCard({ post }: PostCardProps) {
  const t = await getTranslations('common');
  const tBlog = await getTranslations('blog');

  return (
    <article className="border-border-default hover:border-accent-primary flex gap-4 rounded-lg border p-4 transition-colors duration-150">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md">
        <Image
          src={post.heroImage}
          alt={post.heroImageAlt}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        {/* Tasarımda kart etiketi sabit "BLOG"; kategori detay sayfasında
            gösterilir. */}
        <p className="text-accent-primary text-xs font-semibold tracking-[0.08em] uppercase">
          {tBlog('cardLabel')}
        </p>
        <h3 className="text-text-primary mt-1.5 text-base leading-snug font-semibold">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-accent-primary transition-colors"
          >
            {post.title}
          </Link>
        </h3>
        <p className="text-text-muted mt-1.5 line-clamp-2 text-xs leading-relaxed">
          {post.description}
        </p>
        <Link
          href={`/blog/${post.slug}`}
          className="text-accent-primary hover:text-accent-hover mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          {/* Anchor metni başlıktan bağımsız ama anlamlı; "devamı" kullanılmaz. */}
          <span>{t('readMore')}</span>
          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
