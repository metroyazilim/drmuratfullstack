import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { requireAuthSecret } from './env';

/**
 * Panelin saklamak zorunda olduğu tek sır olan SMTP parolası için simetrik
 * şifreleme. Anahtar `AUTH_SECRET`'tan türetilir; bu sırrı döndürmek
 * oturumları geçersiz kıldığı gibi saklı şifreyi de geçersiz kılar — operatör
 * parolayı yeniden girer.
 *
 * Biçim: `v1.<iv>.<tag>.<ciphertext>` (base64url). Sürüm öneki, ileride
 * algoritma değişirse yanlış çözme yerine tespit edilebilsin diye vardır.
 */
const VERSION = 'v1';

function key(): Buffer {
  return createHash('sha256').update(`dmi-secret-box:${requireAuthSecret()}`).digest();
}

export function sealSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [
    VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

/**
 * Biçimi bozuk ya da kimliği doğrulanamayan her değer için `null` döner:
 * kurcalanmış veya eski bir değer istek içinde hata fırlatmak yerine
 * "parola saklanmamış" durumuna düşer.
 */
export function openSecret(sealed: string | null | undefined): string | null {
  if (!sealed) return null;
  const [version, ivPart, tagPart, dataPart] = sealed.split('.');
  if (version !== VERSION || !ivPart || !tagPart || !dataPart) return null;
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch (error) {
    console.error(
      '[secret-box] saklı sır çözülemedi',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
