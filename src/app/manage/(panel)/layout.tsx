import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { requireAdmin } from '@/lib/admin-auth';
import { hasDatabase } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  if (!hasDatabase()) return <DatabaseNotConfigured />;

  const session = await requireAdmin();
  return <AdminShell session={session}>{children}</AdminShell>;
}
