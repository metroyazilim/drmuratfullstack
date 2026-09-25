'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  endAdminSession,
  recordAudit,
  requireAdmin,
  startAdminSession,
} from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export type LoginActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const INVALID_CREDENTIALS = 'E-posta veya parola hatalı.';
const DUMMY_PASSWORD_HASH =
  '$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const input = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!input.success) return { ok: false, error: INVALID_CREDENTIALS };

  try {
    const user = await prisma.adminUser.findUnique({
      where: { email: input.data.email.toLowerCase() },
    });
    const passwordMatches = await bcrypt.compare(
      input.data.password,
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    );
    if (!user || !passwordMatches || !user.isActive) {
      return { ok: false, error: INVALID_CREDENTIALS };
    }

    await startAdminSession(user);
    await recordAudit({
      action: 'login',
      entity: 'AdminUser',
      entityId: user.id,
      actorId: user.id,
      actorEmail: user.email,
      summary: 'Yönetim panelinde oturum açıldı.',
    });
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    revalidatePath('/manage');
  } catch (error) {
    await endAdminSession();
    console.error('[manage/login] Giriş işlemi başarısız oldu:', error);
    return {
      ok: false,
      error: 'Yönetim paneline şu anda erişilemiyor. Lütfen daha sonra tekrar deneyin.',
    };
  }

  redirect('/manage');
}

export async function logoutAction(): Promise<never> {
  const session = await requireAdmin();
  await endAdminSession();
  try {
    await recordAudit({
      action: 'logout',
      entity: 'AdminUser',
      entityId: session.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: 'Yönetim paneli oturumu kapatıldı.',
    });
  } catch (error) {
    console.error('[manage/logout] Çıkış işlemi kaydedilemedi:', error);
  }
  revalidatePath('/manage');
  redirect('/manage/login');
}
