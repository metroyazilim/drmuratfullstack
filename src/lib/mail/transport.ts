import 'server-only';

import nodemailer, { type Transporter } from 'nodemailer';
import { prisma } from '@/lib/db';
import { hasDatabase } from '@/lib/env';
import { openSecret } from '@/lib/secret-box';

export type MailConfig = {
  from: string;
  to: string;
};

export type MailSettingsSource = 'database' | 'environment';

type ResolvedMailSettings = {
  source: MailSettingsSource;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  to: string | null;
};

let cachedResolution: Promise<ResolvedMailSettings | null> | undefined;
let cachedTransport: Promise<Transporter | null> | undefined;

function smtpPassword(): string | undefined {
  return process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
}

function environmentSettings(): ResolvedMailSettings | null {
  const host = process.env.SMTP_HOST?.trim();
  const rawPort = process.env.SMTP_PORT?.trim();
  const port = rawPort ? Number(rawPort) : Number.NaN;
  const user = process.env.SMTP_USER?.trim();
  const password = smtpPassword();

  if (!host || !Number.isInteger(port) || port < 1 || port > 65_535 || !user || !password) {
    return null;
  }

  return {
    source: 'environment',
    host,
    port,
    secure: port === 465,
    user,
    password,
    from: process.env.SMTP_FROM?.trim() || user,
    to: process.env.MAIL_TO?.trim() || null,
  };
}

async function resolveMailSettings(): Promise<ResolvedMailSettings | null> {
  if (hasDatabase()) {
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { singleton: true },
        select: {
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpUser: true,
          smtpPasswordEnc: true,
          smtpFrom: true,
          mailTo: true,
        },
      });

      if (settings?.smtpHost?.trim()) {
        const password = openSecret(settings.smtpPasswordEnc);
        const host = settings.smtpHost.trim();
        const port = settings.smtpPort;
        const user = settings.smtpUser?.trim();
        if (!port || !user || !password) return null;

        return {
          source: 'database',
          host,
          port,
          secure: settings.smtpSecure ?? port === 465,
          user,
          password,
          from: settings.smtpFrom?.trim() || user,
          to: settings.mailTo?.trim() || null,
        };
      }
    } catch (error) {
      console.error('[mail] Veritabanı SMTP ayarları okunamadı, ortam ayarları deneniyor.', error);
    }
  }

  return environmentSettings();
}

async function getResolvedMailSettings(): Promise<ResolvedMailSettings | null> {
  cachedResolution ??= resolveMailSettings();
  return cachedResolution;
}

/**
 * Ayarlar kaydedildiğinde hem çözümlenen bilgileri hem de Nodemailer nesnesini
 * geçersizleştirir. Bir sonraki gönderim güncel verilerle yeni bağlantı kurar.
 */
export function resetTransportCache(): void {
  cachedResolution = undefined;
  cachedTransport = undefined;
}

/** Yönetim ekranında parolayı açığa çıkarmadan etkin kaynağı gösterir. */
export async function getMailSettingsSource(): Promise<MailSettingsSource | null> {
  return (await getResolvedMailSettings())?.source ?? null;
}

/**
 * `MAIL_TO` bulunmadığında çağıranın verdiği klinik adresine düşer. Mevcut
 * çağıranların sözleşmesi korunur; yalnızca DB okuması nedeniyle asenkrondur.
 */
export async function getMailConfig(fallbackTo?: string): Promise<MailConfig | null> {
  const settings = await getResolvedMailSettings();
  if (!settings) return null;

  const to = settings.to || fallbackTo?.trim();
  if (!settings.from || !to) return null;
  return { from: settings.from, to };
}

export async function getTransport(): Promise<Transporter | null> {
  cachedTransport ??= (async () => {
    const settings = await getResolvedMailSettings();
    if (!settings) {
      console.warn('[mail] SMTP yapılandırması eksik.');
      return null;
    }

    return nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: { user: settings.user, pass: settings.password },
    });
  })();

  return cachedTransport;
}
