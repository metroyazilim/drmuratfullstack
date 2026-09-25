/**
 * Yönetim paneli ortam sözleşmesi.
 *
 * Her kapı tembel okunan düz bir boolean kontrolüdür: panel yapılandırılmamış
 * bir dağıtımda (DATABASE_URL yok) kamuya açık site dosya tabanlı içerikle
 * çalışmaya devam eder. Bu, mevcut mimarinin "içerik dosyada" garantisini bozmaz.
 */

const MIN_AUTH_SECRET_LENGTH = 32;

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function hasAuthSecret(): boolean {
  return Boolean(
    process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= MIN_AUTH_SECRET_LENGTH,
  );
}

export function requireDatabase(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error('DATABASE_URL yönetim paneli ve veritabanı tabanlı içerik için zorunludur.');
  }
  return value;
}

export function requireAuthSecret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error('AUTH_SECRET en az 32 karakter olmalıdır.');
  }
  return value;
}

export function getAdminBootstrap(): { email: string; password: string } {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('İlk yöneticiyi oluşturmak için ADMIN_EMAIL ve ADMIN_PASSWORD gerekir.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD en az 12 karakter olmalıdır.');
  }
  return { email: email.trim().toLowerCase(), password };
}

/**
 * R2 medya deposu opsiyoneldir: tanımlı değilse medya kitaplığı yerel diske
 * (`public/uploads`) yazan geliştirme sağlayıcısına düşer. Üretimde dosya
 * sistemi salt okunur olduğu için R2 zorunludur.
 */
export function hasMediaStorage(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET,
  );
}
