'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AdminSession } from '@/lib/admin-auth';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

type AdminNavigationContextValue = {
  mobileOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
};

const AdminNavigationContext = createContext<AdminNavigationContextValue | null>(null);

export function useAdminNavigation(): AdminNavigationContextValue {
  const context = useContext(AdminNavigationContext);
  if (!context) throw new Error('Yönetim gezinme bağlamı bulunamadı.');
  return context;
}

export function AdminShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AdminSession;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = useMemo(
    () => ({
      mobileOpen,
      openMobileMenu: () => setMobileOpen(true),
      closeMobileMenu: () => setMobileOpen(false),
    }),
    [mobileOpen],
  );

  return (
    <AdminNavigationContext.Provider value={navigation}>
      <div className="min-h-svh bg-bg-surface">
        <AdminSidebar session={session} />
        <div className="lg:ms-64">
          <AdminTopbar session={session} />
          <main className="px-4 py-6 lg:px-8 lg:py-7">{children}</main>
        </div>
      </div>
    </AdminNavigationContext.Provider>
  );
}
