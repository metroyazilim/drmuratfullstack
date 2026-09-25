import { PrismaClient } from '@prisma/client';
import { requireDatabase } from './env';

/**
 * Turbopack geliştirme modunda route modülleri istek başına yeniden
 * değerlendirilir; modül seviyesinde `new PrismaClient()` her yeniden yüklemede
 * yeni bir havuz açardı. `globalThis` bunu aşar.
 */
const globalForPrisma = globalThis as unknown as { clinicPrisma?: PrismaClient };

/**
 * Prisma'nın varsayılan havuzu çekirdek sayısına göre ölçeklenir
 * (`cpu * 2 + 1`). `next build` prerender'ı 9 işçi süreci açtığı ve her biri
 * kendi istemcisini kurduğu için varsayılan ayar veritabanının bağlantı
 * sınırını tüketir ("too many clients already"). Adres dizesinde açıkça
 * belirtilmemişse havuzu sınırlıyoruz; üretimde havuzlanmış (pgBouncer/Neon
 * pooler) bir adres verilirse o değer aynen korunur.
 */
function boundedDatabaseUrl(): string {
  const url = requireDatabase();
  if (url.includes('connection_limit=')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}connection_limit=5`;
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.clinicPrisma) {
    globalForPrisma.clinicPrisma = new PrismaClient({
      datasources: { db: { url: boundedDatabaseUrl() } },
    });
  }
  return globalForPrisma.clinicPrisma;
}

/**
 * Gerçek istemciyi ilk özellik erişiminde çözer: `prisma` import etmek,
 * rotası henüz `hasDatabase()` kontrolü yapmamış bir modülde asla hata
 * fırlatmaz — yalnızca içine çağrı yapmak fırlatır.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    return Reflect.get(getPrisma(), property);
  },
});
