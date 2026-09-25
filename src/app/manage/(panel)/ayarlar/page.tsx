import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireAdmin } from '@/lib/admin-auth';
import { getClinicSettings } from '@/lib/admin/site-settings';
import { getClinic } from '@/lib/content';
import { hasDatabase } from '@/lib/env';
import { ClinicSettingsForm } from './ClinicSettingsForm';

export default async function ClinicSettingsPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  await requireAdmin();
  const clinic = (await getClinicSettings()) ?? (await getClinic());

  return (
    <div className={`${pageShell} space-y-6`}>
      <PageHeader
        title="Klinik künyesi"
        description="Klinik, hekim, iletişim, adres ve çalışma saati bilgilerini yönetin."
      />
      <ClinicSettingsForm clinic={clinic} />
    </div>
  );
}
