import { createHash } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Form gönderiminde IP başına oran sınırı.
 *
 * Redis yapılandırılmamışsa ya da erişilemezse sınır ATLANIR ve olay
 * loglanır (architecture.md → Invariant 14). Bir hastanın randevu
 * talebini kaybetmektense birkaç spam maili almak yeğdir.
 *
 * IP ham haliyle saklanmaz; hash'lenerek anahtar üretilir ve TTL
 * sonunda kendini siler.
 */
const WINDOW = '1 h' as const;
const LIMIT = 5;

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[rate-limit] Upstash yapılandırılmamış — oran sınırı atlanıyor.');
    limiter = null;
    return limiter;
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(LIMIT, WINDOW),
    prefix: 'dmi:form',
  });

  return limiter;
}

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

/** true → izin var. Altyapı arızasında da true döner (bilinçli). */
export async function checkRateLimit(ip: string, formKey: string): Promise<boolean> {
  const instance = getLimiter();
  if (!instance) return true;

  try {
    const { success } = await instance.limit(`${formKey}:${hashIp(ip)}`);
    return success;
  } catch (error) {
    console.error('[rate-limit] Redis erişilemedi, sınır atlandı:', error);
    return true;
  }
}
