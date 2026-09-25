import { ContentType } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { requireAdmin } from '@/lib/admin-auth';
import { contentTypeFromSegment } from '@/lib/admin/content-model';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';

const paramsSchema = z.object({
  type: z.string().trim().min(1),
  id: z.string().trim().min(1),
});

const TYPE_BY_NAME: Readonly<Record<string, ContentType>> = {
  service: ContentType.SERVICE,
  post: ContentType.POST,
  team: ContentType.TEAM,
  page: ContentType.PAGE,
  legal: ContentType.LEGAL,
};

type Params = Promise<{ type: string; id: string }>;

export default async function SeoDetailPage({ params }: { params: Params }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const contentType =
    contentTypeFromSegment(parsed.data.type) ?? TYPE_BY_NAME[parsed.data.type.toLowerCase()];
  if (!contentType) notFound();

  const entry = await prisma.contentEntry.findFirst({
    where: { id: parsed.data.id, type: contentType },
    select: { id: true },
  });
  if (!entry) notFound();
  redirect(`/manage/seo?item=${encodeURIComponent(`content:${entry.id}`)}`);
}
