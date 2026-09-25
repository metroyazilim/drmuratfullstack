import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AdminRole, Prisma } from '@prisma/client';
import { prisma } from './db';
import { ADMIN_SESSION_COOKIE, signSessionToken, verifySessionToken } from './session-token';

export { ADMIN_SESSION_COOKIE };

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

export async function startAdminSession(user: {
  id: string;
  email: string;
  name: string;
  tokenVersion: number;
}): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_SESSION_COOKIE, await signSessionToken(user, SESSION_MAX_AGE), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const payload = await verifySessionToken(store.get(ADMIN_SESSION_COOKIE)?.value);
  if (!payload?.sub) return null;
  try {
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || user.tokenVersion !== payload.ver) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch (error) {
    console.error('[admin-auth] session lookup unavailable', error);
    return null;
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/manage/login');
  return session;
}

/**
 * Kullanıcı yönetimi gibi yalnızca SUPER_ADMIN'e açık mutasyonların kapısı.
 * Hata fırlatmaz, yönlendirir: doğrudan adres yazarak gelen bir istek,
 * oturumsuz istekle aynı şekilde sönümlenir.
 */
export async function requireSuperAdmin(): Promise<AdminSession> {
  const session = await requireAdmin();
  if (session.role !== 'SUPER_ADMIN') redirect('/manage');
  return session;
}

export async function recordAudit(data: {
  action: string;
  entity: string;
  entityId?: string;
  actorId?: string;
  actorEmail: string;
  summary?: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: { ...data, metadata: data.metadata ?? undefined },
  });
}
