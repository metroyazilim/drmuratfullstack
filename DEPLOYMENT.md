# Dağıtım — Dokploy / Docker Compose

Üretim iki servisli bir Compose yığını olarak çalışır: `web` (Next.js standalone
sunucusu) ve `db` (PostgreSQL 17). Dokploy imajı bu depodan derler, arayüzde
tanımladığın ortam değişkenlerini enjekte eder ve kendi Traefik proxy'sini `web`
servisine yönlendirir. Bilinçli olarak host portu yayınlanmaz — alan adı ve TLS
Dokploy'un sorumluluğundadır.

## 1. Depodaki dosyalar

| Dosya | Amaç |
| --- | --- |
| `Dockerfile` | Üç aşamalı üretim imajı (deps → build → runtime). Root olmayan `nextjs` kullanıcısıyla çalışır; yalnızca `.next/standalone`, `public`, `content` ve Prisma istemcisi/CLI'si taşınır. |
| `docker/entrypoint.sh` | Sunucu açılmadan önce `prisma migrate deploy` çalıştırır. İdempotenttir — her yeniden dağıtımda ve dump geri yüklendikten sonra güvenlidir. |
| `docker-compose.yml` | Üretim yığını (`web` + `db`), Dokploy bunu kullanır. |
| `.env.production.example` | Yığının okuduğu tüm değişkenler ve hangilerinin zorunlu olduğu. |
| `src/app/api/health/route.ts` | `GET /api/health` — konteyner canlılık probu, Postgres'e dokunmaz. |

## 2. Dokploy'da ilk dağıtım

1. **Uygulama oluştur** → tür **Docker Compose**, bu Git deposunu ve kök dizindeki `docker-compose.yml` dosyasını seç.
2. **Environment** → `.env.production.example` içeriğini doldurup yapıştır.
   Zorunlu: `NEXT_PUBLIC_SITE_URL`, `POSTGRES_PASSWORD`, `AUTH_SECRET`.
   `NEXT_PUBLIC_SITE_URL` bir **build argümanıdır** — sonradan değiştirmek yeniden başlatmayı değil, yeniden derlemeyi gerektirir.
3. **Domain** → alan adını `web` servisine bağla, konteyner portu `3000`, HTTPS'i (Let's Encrypt) aç.
4. **Deploy.** Entrypoint migration'ları uygular, ardından sunucu `0.0.0.0:3000` üzerinde açılır.

## 3. Mevcut veritabanının taşınması

Şu anki içerik (hizmetler, blog, ekip, kurumsal sayfalar, SSS, galeri, anasayfa
ve liste metinleri, medya kayıtları, yönetici hesapları, talepler, işlem kaydı)
yerel geliştirme veritabanında duruyor. `pg_dump` çıktıları `backups/` altındadır
ve gitignore edilmiştir — parola hash'leri ile şifrelenmiş SMTP sırrını içerirler.

Taşımadan önce taze bir dump al:

```bash
docker exec umin-global-db-1 pg_dump -U umin -d drmurat_dev \
  --format=custom --no-owner --no-privileges -f /tmp/drmurat.dump
docker cp umin-global-db-1:/tmp/drmurat.dump ./backups/drmurat_$(date +%Y%m%d_%H%M%S).dump
```

Üretim yığınına geri yükle (compose, `./backups` dizinini `db` konteynerine
salt-okunur bağlar):

```bash
# Dokploy sunucusunda, dağıtılan proje dizininden:
docker compose exec -T db pg_restore -U drmurat -d drmurat \
  --clean --if-exists --no-owner --no-privileges < backups/drmurat_<zaman>.dump
```

Sıralama önemli değildir: `prisma migrate deploy` yalnızca `_prisma_migrations`
tablosunda bulunmayan migration'ları uygular; dump bu tabloyu zaten içerdiği için
hiçbir migration tekrar çalışmaz ve hiçbir satır yeniden yazılmaz.

Boş bir veritabanıyla başlıyorsan:

```bash
docker compose exec web node ./node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma
# Yönetici hesabı ve içerik aktarımı dev bağımlılıklarına ihtiyaç duyar; bunları
# çalışma zamanı imajından değil, `npm ci` yapılmış bir checkout'tan çalıştır:
npm run db:seed
npm run content:import
```

## 4. Zorunlu operasyonel ayarlar

- **`AUTH_SECRET`** — oturum imzası ve panelde saklanan SMTP parolasının AES-256-GCM şifrelemesi. Döndürülürse tüm oturumlar düşer ve kayıtlı SMTP parolası okunamaz hâle gelir (Ayarlar → E-posta'dan yeniden girilmelidir).
- **R2 medya deposu** — `R2_*` değişkenleri tanımsızsa yüklemeler konteynerdeki `uploads` volume'una yazılır. Tek sunucuda çalışır, ancak birden fazla replika veya sunucu değişiminde R2 şarttır; panel bu durumda uyarı gösterir.
- **SMTP** — formlar önce panelde saklanan (şifreli) ayarları, yoksa `SMTP_*` değişkenlerini kullanır. `MAIL_TO` talep e-postalarının düşeceği adresi belirler. SMTP eksikse form sessizce "gönderildi" demez; kullanıcıya telefonla ulaşması söylenir.
- **Yedek** — `db` servisine karşı düzenli `pg_dump` planla; aksi hâlde tek kalıcı kopya `db-data` volume'udur.

## 5. Yeniden dağıtım

```bash
git push            # Dokploy imajı yeniden derler ve `web` servisini yeniler
```

Veri korunur: `db-data` adlandırılmış bir volume'dur ve migration'lar eklemelidir.
Şema değişikliği üretime ancak commit edilmiş bir Prisma migration dosyasıyla
ulaşır — entrypoint asla `prisma db push` çalıştırmaz.

## 6. Sağlık ve loglar

```bash
curl -fsS https://<alan-adi>/api/health    # {"status":"ok","uptime":…}
docker compose logs -f web
docker compose ps                           # `db` (healthy) raporlamalı
```
