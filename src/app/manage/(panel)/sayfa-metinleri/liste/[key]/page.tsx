import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell, secondaryButton } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import {
  isListingKey,
  LISTING_LABELS,
} from '@/lib/admin/structured-content';
import { isAdminLocale, type Locale } from '@/lib/admin/locales';
import { listingSchemas } from '@/lib/content/schemas';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { ListingEditor } from '../ListingEditor';

type ListingDetailPageProps = {
  params: Promise<{ key: string }>;
};

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const { key } = await params;
  if (!isListingKey(key)) notFound();

  const rows = await prisma.listingContent.findMany({
    where: { key },
    orderBy: { locale: 'asc' },
  });
  const initialContent: Partial<Record<Locale, unknown>> = {};
  for (const row of rows) {
    if (!isAdminLocale(row.locale)) continue;
    const parsed = listingSchemas[key].safeParse(row.data);
    if (parsed.success) initialContent[row.locale] = parsed.data;
  }

  return (
    <div className={pageShell}>
      <PageHeader
        title={`${LISTING_LABELS[key]} Sayfası`}
        description="Sayfa üst alanını, giriş metnini ve bu sayfaya özel blokları dört dilde düzenleyin."
        actions={
          <Link href="/manage/sayfa-metinleri/liste" className={secondaryButton}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Listeye dön
          </Link>
        }
      />
      <ListingEditor listingKey={key} initialContent={initialContent} />
    </div>
  );
}
