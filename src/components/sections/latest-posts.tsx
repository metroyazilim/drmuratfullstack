import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { SectionLabel } from '@/components/ui/section-label';
import { PostCard } from '@/components/shared/post-card';
import { Reveal } from '@/components/shared/reveal';
import type { Home, PostSummary } from '@/lib/content/types';

type LatestPostsProps = {
  copy: Home['blog'];
  posts: PostSummary[];
};

export function LatestPosts({ copy, posts }: LatestPostsProps) {
  if (posts.length === 0) return null;

  return (
    <Section variant="base">
      <Container>
        <div className="text-center">
          <SectionLabel>{copy.eyebrow}</SectionLabel>
          <h2 className="text-text-primary mt-3 text-2xl font-bold tracking-tight md:text-4xl">
            {copy.title}
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {posts.map((post, index) => (
            <Reveal key={post.id} direction="up" delay={(index % 2) * 90}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
