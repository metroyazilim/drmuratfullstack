import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { isAdminLocale, type Locale } from '@/lib/admin/locales';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { GalleryManager, type GalleryManagerImage } from './GalleryManager';

export default async function GalleryPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();

  const rows = await prisma.galleryImage.findMany({
    include: { alts: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  });
  const images: GalleryManagerImage[] = rows.map((row) => {
    const alts: Partial<Record<Locale, string>> = {};
    for (const localized of row.alts) {
      if (isAdminLocale(localized.locale)) alts[localized.locale] = localized.alt;
    }
    return { id: row.id, path: row.path, alts };
  });

  return (
    <div className={pageShell}>
      <PageHeader
        title="Galeri"
        description="Galeri görsellerini sıralayın ve erişilebilirlik için dört dilde alternatif metinlerini yönetin."
      />
      <GalleryManager images={images} />
    </div>
  );
}
