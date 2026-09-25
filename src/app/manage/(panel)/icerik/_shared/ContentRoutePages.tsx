import type { ContentType } from '@prisma/client';
import { notFound } from 'next/navigation';
import { ContentEditorPanel, type ContentEditorEntry } from '@/components/admin/ContentEditorPanel';
import { ContentListView } from '@/components/admin/ContentListView';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { CONTENT_TYPES, mergeFrontmatter } from '@/lib/admin/content-model';
import { validateLocaleInput } from '@/lib/admin/content-validation';
import { isAdminLocale } from '@/lib/admin/locales';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';

export async function ContentTypeListPage({ type }: { type: ContentType }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;

  const meta = CONTENT_TYPES[type];
  const entries = await prisma.contentEntry.findMany({
    where: { type },
    include: { locales: true },
    orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
  });

  return (
    <ContentListView
      type={type}
      label={meta.label}
      singular={meta.singular}
      segment={meta.segment}
      hasOrder={meta.hasOrder}
      canCreate={meta.canCreate}
      entries={entries.map((entry) => ({
        id: entry.id,
        key: entry.key,
        status: entry.status,
        order: entry.order,
        updatedAt: entry.updatedAt.toISOString(),
        locales: entry.locales.flatMap((localeRow) => {
          if (!isAdminLocale(localeRow.locale)) return [];
          const frontmatter = mergeFrontmatter(localeRow);
          return [
            {
              locale: localeRow.locale,
              title: localeRow.title,
              complete: validateLocaleInput(type, localeRow.locale, frontmatter).ok,
            },
          ];
        }),
      }))}
    />
  );
}

export async function ContentTypeEditorPage({
  type,
  id,
}: {
  type: ContentType;
  id: string;
}) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;

  const meta = CONTENT_TYPES[type];
  const [entry, relatedEntries] = await Promise.all([
    prisma.contentEntry.findFirst({
      where: { id, type },
      include: { locales: true },
    }),
    type === 'SERVICE' || type === 'POST'
      ? prisma.contentEntry.findMany({
          where: { type: type === 'SERVICE' ? 'POST' : 'SERVICE' },
          select: {
            key: true,
            locales: {
              where: { locale: 'tr' },
              select: { title: true },
              take: 1,
            },
          },
          orderBy: [{ order: 'asc' }, { updatedAt: 'desc' }],
        })
      : Promise.resolve([]),
  ]);
  if (!entry) notFound();

  const locales: ContentEditorEntry['locales'] = entry.locales.flatMap((localeRow) => {
    if (!isAdminLocale(localeRow.locale)) return [];
    const frontmatter = mergeFrontmatter(localeRow);
    return [
      {
        locale: localeRow.locale,
        body: localeRow.body,
        frontmatter,
        complete: validateLocaleInput(type, localeRow.locale, frontmatter).ok,
        updatedAt: localeRow.updatedAt.toISOString(),
      },
    ];
  });
  const editorEntry: ContentEditorEntry = {
    id: entry.id,
    key: entry.key,
    type: entry.type,
    status: entry.status,
    order: entry.order,
    locales,
  };
  const relatedOptions = relatedEntries.map((related) => ({
    key: related.key,
    title: related.locales[0]?.title ?? related.key,
  }));

  return (
    <ContentEditorPanel
      mode="edit"
      entry={editorEntry}
      segment={meta.segment}
      relatedPosts={type === 'SERVICE' ? relatedOptions : undefined}
      relatedServices={type === 'POST' ? relatedOptions : undefined}
    />
  );
}

export function ContentTypeCreatePage({ type }: { type: ContentType }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  const meta = CONTENT_TYPES[type];
  if (!meta.canCreate) notFound();
  return <ContentEditorPanel mode="create" type={type} segment={meta.segment} />;
}
