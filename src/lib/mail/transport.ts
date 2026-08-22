import nodemailer, { type Transporter } from 'nodemailer';

/**
 * SMTP transport'u modül seviyesinde bir kez kurulur.
 *
 * Bilgiler eksikse `null` döner — build kırılmaz, sayfa çalışır, form
 * denendiğinde anlaşılır bir hata verir. Sessizce "gönderildi" demek
 * yasak: kaybolan bir randevu talebi, görünen bir hatadan kötüdür.
 */
let cached: Transporter | null | undefined;

export type MailConfig = {
  from: string;
  to: string;
};

export function getMailConfig(): MailConfig | null {
  const from = process.env.SMTP_FROM;
  const to = process.env.MAIL_TO;
  if (!from || !to) return null;
  return { from, to };
}

export function getTransport(): Transporter | null {
  if (cached !== undefined) return cached;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !port || !user || !pass || !getMailConfig()) {
    console.warn(
      '[mail] SMTP yapılandırması eksik — form gönderimleri mail_failed dönecek. ' +
        'Gerekli değişkenler: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, MAIL_TO',
    );
    cached = null;
    return cached;
  }

  cached = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });

  return cached;
}
