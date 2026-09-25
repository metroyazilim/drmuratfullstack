import { DatabaseNotConfigured } from '@/components/admin/DatabaseNotConfigured';
import { PageHeader } from '@/components/admin/PageHeader';
import { pageShell } from '@/components/admin/ui';
import { requireSuperAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { UsersManager } from './UsersManager';

export default async function UsersPage() {
  if (!hasDatabase()) return <DatabaseNotConfigured />;
  const session = await requireSuperAdmin();
  const users = await prisma.adminUser.findMany({
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return (
    <div className={pageShell}>
      <PageHeader
        title="Kullanıcılar"
        description="Yönetim paneli hesaplarını, rollerini, durumlarını ve parola sıfırlama işlemlerini yönetin."
      />
      <UsersManager
        currentUserId={session.id}
        users={users.map((user) => ({
          ...user,
          lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
