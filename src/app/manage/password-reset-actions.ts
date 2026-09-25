'use server';

import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { recordAudit } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';
import { getMailConfig, getTransport } from '@/lib/mail/transport';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 12;
const NEUTRAL_SUCCESS =
  'Bu adres kayıtlıysa parola sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu kontrol edin.';
const MAIL_NOT_CONFIGURED =
  'E-posta gönderimi yapılandırılmamış, yöneticinizle görüşün.';

export type PasswordResetActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

const applySchema = z
  .object({
    token: z.string().trim().min(16),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    passwordConfirm: z.string().min(MIN_PASSWORD_LENGTH),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: 'Parolalar eşleşmiyor.',
    path: ['passwordConfirm'],
  });

export async function requestPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const input = requestSchema.safeParse({ email: formData.get('email') });
  if (!input.success) return { ok: false, error: 'Geçerli bir e-posta adresi girin.' };

  try {
    const [transport, mailConfig] = await Promise.all([
      getTransport(),
      getMailConfig(input.data.email),
    ]);
    if (!transport || !mailConfig) {
      return { ok: false, error: MAIL_NOT_CONFIGURED };
    }

    const user = await prisma.adminUser.findUnique({
      where: { email: input.data.email },
      select: { id: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) return { ok: true, message: NEUTRAL_SUCCESS };

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const now = new Date();

    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: now },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
      /\/+$/,
      '',
    );
    const resetUrl = `${baseUrl}/manage/reset-password?token=${encodeURIComponent(token)}`;
    let mailDelivered = true;
    try {
      await transport.sendMail({
        from: mailConfig.from,
        to: user.email,
        subject: 'Dr. Murat Irmak Yönetim Paneli — Parola Sıfırlama',
        text: `Parolanızı yenilemek için aşağıdaki bağlantıyı açın. Bağlantı 1 saat geçerlidir.\n\n${resetUrl}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.`,
        html: `<p>Parolanızı yenilemek için aşağıdaki bağlantıyı açın. Bağlantı <strong>1 saat</strong> geçerlidir.</p><p><a href="${resetUrl}">Parolamı yenile</a></p><p>Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`,
      });
    } catch (error) {
      mailDelivered = false;
      console.error('[manage/password-reset] Sıfırlama e-postası gönderilemedi:', error);
    }

    await recordAudit({
      action: 'password-reset-requested',
      entity: 'AdminUser',
      entityId: user.id,
      actorId: user.id,
      actorEmail: user.email,
      summary: 'Parola sıfırlama bağlantısı istendi.',
      metadata: { mailDelivered },
    });
    revalidatePath('/manage/kullanicilar');

    return { ok: true, message: NEUTRAL_SUCCESS };
  } catch (error) {
    console.error('[manage/password-reset] Sıfırlama isteği başarısız oldu:', error);
    return { ok: true, message: NEUTRAL_SUCCESS };
  }
}

export async function applyPasswordResetAction(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const input = applySchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
  });
  if (!input.success) {
    const mismatch = input.error.issues.some(
      (issue) => issue.message === 'Parolalar eşleşmiyor.',
    );
    return {
      ok: false,
      error: mismatch
        ? 'Parolalar eşleşmiyor.'
        : `Parola en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`,
    };
  }

  const invalidResult: PasswordResetActionState = {
    ok: false,
    error: 'Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir bağlantı isteyin.',
  };

  try {
    const tokenHash = createHash('sha256').update(input.data.token).digest('hex');
    const grant = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { email: true, isActive: true } } },
    });
    if (
      !grant ||
      !grant.user.isActive ||
      grant.usedAt ||
      grant.expiresAt.getTime() <= Date.now()
    ) {
      return invalidResult;
    }

    const passwordHash = await bcrypt.hash(input.data.password, 12);
    const applied = await prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.updateMany({
        where: { id: grant.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      });
      if (claimed.count !== 1) return false;

      await transaction.adminUser.update({
        where: { id: grant.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      });
      return true;
    });
    if (!applied) return invalidResult;

    await recordAudit({
      action: 'password-reset-applied',
      entity: 'AdminUser',
      entityId: grant.userId,
      actorId: grant.userId,
      actorEmail: grant.user.email,
      summary: 'Yönetici parolası yenilendi.',
    });
    revalidatePath('/manage/kullanicilar');
    return {
      ok: true,
      message: 'Parolanız güncellendi. Şimdi giriş yapabilirsiniz.',
    };
  } catch (error) {
    console.error('[manage/password-reset] Yeni parola kaydedilemedi:', error);
    return invalidResult;
  }
}
