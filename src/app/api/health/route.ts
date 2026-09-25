import { NextResponse } from 'next/server';

/**
 * Konteyner çalışma zamanı için canlılık probu (Docker HEALTHCHECK, Dokploy,
 * yük dengeleyiciler). Bilinçli olarak Postgres'e dokunmaz: veritabanı
 * erişilemez olduğunda site content/ dosyalarından okumaya devam ettiği için
 * bir veritabanı kesintisi sağlıklı konteynerin öldürülmesine yol açmamalıdır.
 * Veritabanı erişilebilirliği izleme sisteminin işidir, canlılık sinyalinin değil.
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({ status: 'ok', uptime: process.uptime() });
}
