'use server';

import { createHash, randomBytes } from 'node:crypto';
import { AdminRole, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit, requireSuperAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { getMailConfig, getTransport } from '@/lib/mail/transport';

export type UserActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Ad en az 2 karakter olmalıdır.'),
  email: z.string().trim().toLowerCase().email('Geçerli bir e-posta adresi yazın.'),
  role: z.nativeEnum(AdminRole),
  password: z.string().min(12, 'Geçici parola en az 12 karakter olmalıdır.'),
});

const roleSchema = z.object({
  id: z.string().trim().min(1),
  role: z.nativeEnum(AdminRole),
});

const statusSchema = z.object({
  id: z.string().trim().min(1),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

const idSchema = z.object({ id: z.string().trim().min(1) });

function validationFailure(error: z.ZodError): UserActionResult {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    if (!errors[field]) errors[field] = issue.message;
  }
  return {
    ok: false,
    error: error.issues[0]?.message ?? 'Kullanıcı alanlarını kontrol edin.',
    fieldErrors: errors,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function createAdminUserAction(
  _previous: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const session = await requireSuperAdmin();
  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    role: formData.get('role'),
    password: formData.get('password'),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const created = await prisma.adminUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
      select: { id: true },
    });
    await recordAudit({
      action: 'create',
      entity: 'AdminUser',
      entityId: created.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${parsed.data.email} yönetim kullanıcısı oluşturuldu.`,
      metadata: { role: parsed.data.role },
    });
    revalidatePath('/manage/kullanicilar');
    return { ok: true, message: 'Kullanıcı oluşturuldu.' };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { ok: false, error: 'Bu e-posta adresi zaten kayıtlı.' };
    }
    console.error('[manage/kullanicilar] Kullanıcı oluşturulamadı:', error);
    return { ok: false, error: 'Kullanıcı oluşturulamadı. Lütfen yeniden deneyin.' };
  }
}

export async function changeAdminUserRoleAction(
  _previous: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const session = await requireSuperAdmin();
  const parsed = roleSchema.safeParse({ id: formData.get('id'), role: formData.get('role') });
  if (!parsed.success) return { ok: false, error: 'Kullanıcı veya rol geçersiz.' };
  if (parsed.data.id === session.id) return { ok: false, error: 'Kendi rolünüzü değiştiremezsiniz.' };

  try {
    const target = await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.adminUser.findUnique({
          where: { id: parsed.data.id },
          select: { id: true, email: true, role: true },
        });
        if (!current) return null;
        if (current.role === AdminRole.SUPER_ADMIN && parsed.data.role !== AdminRole.SUPER_ADMIN) {
          const count = await transaction.adminUser.count({
            where: { role: AdminRole.SUPER_ADMIN },
          });
          if (count <= 1) throw new Error('LAST_SUPER_ADMIN');
        }
        return transaction.adminUser.update({
          where: { id: current.id },
          data: { role: parsed.data.role },
          select: { id: true, email: true, role: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!target) return { ok: false, error: 'Kullanıcı bulunamadı.' };

    await recordAudit({
      action: 'role.update',
      entity: 'AdminUser',
      entityId: target.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${target.email} kullanıcısının rolü ${target.role} olarak değiştirildi.`,
    });
    revalidatePath('/manage/kullanicilar');
    return { ok: true, message: 'Kullanıcı rolü güncellendi.' };
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_SUPER_ADMIN') {
      return { ok: false, error: 'Sistemde en az bir etkin SUPER_ADMIN kalmalıdır.' };
    }
    console.error('[manage/kullanicilar] Rol güncellenemedi:', error);
    return { ok: false, error: 'Kullanıcı rolü güncellenemedi.' };
  }
}

export async function changeAdminUserStatusAction(
  _previous: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const session = await requireSuperAdmin();
  const parsed = statusSchema.safeParse({
    id: formData.get('id'),
    isActive: formData.get('isActive'),
  });
  if (!parsed.success) return { ok: false, error: 'Kullanıcı durumu geçersiz.' };
  if (parsed.data.id === session.id && !parsed.data.isActive) {
    return { ok: false, error: 'Kendi hesabınızı pasifleştiremezsiniz.' };
  }

  try {
    const target = await prisma.$transaction(
      async (transaction) => {
        const current = await transaction.adminUser.findUnique({
          where: { id: parsed.data.id },
          select: { id: true, email: true, role: true, isActive: true },
        });
        if (!current) return null;
        if (
          current.role === AdminRole.SUPER_ADMIN &&
          current.isActive &&
          !parsed.data.isActive
        ) {
          const activeSuperAdmins = await transaction.adminUser.count({
            where: { role: AdminRole.SUPER_ADMIN, isActive: true },
          });
          if (activeSuperAdmins <= 1) throw new Error('LAST_SUPER_ADMIN');
        }
        return transaction.adminUser.update({
          where: { id: current.id },
          data: {
            isActive: parsed.data.isActive,
            ...(!parsed.data.isActive ? { tokenVersion: { increment: 1 } } : {}),
          },
          select: { id: true, email: true, isActive: true },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!target) return { ok: false, error: 'Kullanıcı bulunamadı.' };

    await recordAudit({
      action: target.isActive ? 'activate' : 'deactivate',
      entity: 'AdminUser',
      entityId: target.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${target.email} hesabı ${target.isActive ? 'etkinleştirildi' : 'pasifleştirildi'}.`,
    });
    revalidatePath('/manage/kullanicilar');
    return {
      ok: true,
      message: target.isActive
        ? 'Kullanıcı etkinleştirildi.'
        : 'Kullanıcı pasifleştirildi ve açık oturumları kapatıldı.',
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_SUPER_ADMIN') {
      return { ok: false, error: 'Sistemde en az bir etkin SUPER_ADMIN kalmalıdır.' };
    }
    console.error('[manage/kullanicilar] Durum güncellenemedi:', error);
    return { ok: false, error: 'Kullanıcı durumu güncellenemedi.' };
  }
}

export async function sendAdminPasswordResetAction(
  _previous: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const session = await requireSuperAdmin();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'Kullanıcı bulunamadı.' };

  let tokenId: string | null = null;
  try {
    const user = await prisma.adminUser.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, email: true, name: true, isActive: true },
    });
    if (!user) return { ok: false, error: 'Kullanıcı bulunamadı.' };
    if (!user.isActive) return { ok: false, error: 'Pasif kullanıcıya sıfırlama e-postası gönderilemez.' };

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const now = new Date();
    const created = await prisma.$transaction(async (transaction) => {
      await transaction.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      });
      return transaction.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
        },
        select: { id: true },
      });
    });
    tokenId = created.id;

    const [transport, config] = await Promise.all([getTransport(), getMailConfig(user.email)]);
    if (!transport || !config) throw new Error('MAIL_NOT_CONFIGURED');
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '');
    const link = `${baseUrl}/manage/reset-password?token=${encodeURIComponent(token)}`;
    await transport.sendMail({
      from: config.from,
      to: user.email,
      subject: 'Dr. Murat Irmak Kliniği Yönetim Paneli — Parola Sıfırlama',
      text: `Merhaba ${user.name},\n\nParolanızı sıfırlamak için bir saat geçerli olan bağlantıyı açın:\n${link}\n\nBu işlemi siz istemediyseniz e-postayı yok sayabilirsiniz.`,
      html: `<p>Merhaba ${escapeHtml(user.name)},</p><p>Parolanızı sıfırlamak için bir saat geçerli olan bağlantıyı açın:</p><p><a href="${link}">Parolamı sıfırla</a></p><p>Bu işlemi siz istemediyseniz e-postayı yok sayabilirsiniz.</p>`,
    });
    await recordAudit({
      action: 'password.reset.email',
      entity: 'AdminUser',
      entityId: user.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${user.email} adresine parola sıfırlama bağlantısı gönderildi.`,
    });
    revalidatePath('/manage/kullanicilar');
    return { ok: true, message: 'Parola sıfırlama e-postası gönderildi.' };
  } catch (error) {
    if (tokenId) {
      await prisma.passwordResetToken
        .updateMany({ where: { id: tokenId, usedAt: null }, data: { usedAt: new Date() } })
        .catch((cleanupError: unknown) =>
          console.error('[manage/kullanicilar] Geçersiz token temizlenemedi:', cleanupError),
        );
      await recordAudit({
        action: 'password.reset.email.failed',
        entity: 'AdminUser',
        entityId: parsed.data.id,
        actorId: session.id,
        actorEmail: session.email,
        summary: 'Parola sıfırlama e-postası gönderilemedi; oluşturulan bağlantı geçersizleştirildi.',
      }).catch((auditError: unknown) =>
        console.error('[manage/kullanicilar] Başarısız e-posta işlemi kaydedilemedi:', auditError),
      );
    }
    console.error('[manage/kullanicilar] Parola sıfırlama e-postası gönderilemedi:', error);
    return {
      ok: false,
      error:
        error instanceof Error && error.message === 'MAIL_NOT_CONFIGURED'
          ? 'SMTP ayarları tamamlanmadan e-posta gönderilemez.'
          : 'Parola sıfırlama e-postası gönderilemedi.',
    };
  }
}

export async function deleteAdminUserAction(
  _previous: UserActionResult,
  formData: FormData,
): Promise<UserActionResult> {
  const session = await requireSuperAdmin();
  const parsed = idSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { ok: false, error: 'Kullanıcı bulunamadı.' };
  if (parsed.data.id === session.id) return { ok: false, error: 'Kendi hesabınızı silemezsiniz.' };

  try {
    const deleted = await prisma.$transaction(
      async (transaction) => {
        const target = await transaction.adminUser.findUnique({
          where: { id: parsed.data.id },
          select: { id: true, email: true, role: true },
        });
        if (!target) return null;
        if (target.role === AdminRole.SUPER_ADMIN) {
          const count = await transaction.adminUser.count({
            where: { role: AdminRole.SUPER_ADMIN },
          });
          if (count <= 1) throw new Error('LAST_SUPER_ADMIN');
        }
        await transaction.adminUser.delete({ where: { id: target.id } });
        return target;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (!deleted) return { ok: false, error: 'Kullanıcı bulunamadı.' };

    await recordAudit({
      action: 'delete',
      entity: 'AdminUser',
      entityId: deleted.id,
      actorId: session.id,
      actorEmail: session.email,
      summary: `${deleted.email} yönetim kullanıcısı silindi.`,
    });
    revalidatePath('/manage/kullanicilar');
    return { ok: true, message: 'Kullanıcı silindi.' };
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_SUPER_ADMIN') {
      return { ok: false, error: 'Son SUPER_ADMIN kullanıcısı silinemez.' };
    }
    console.error('[manage/kullanicilar] Kullanıcı silinemedi:', error);
    return { ok: false, error: 'Kullanıcı silinemedi. Lütfen yeniden deneyin.' };
  }
}
