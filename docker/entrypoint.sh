#!/bin/sh
# Bekleyen Prisma migration'larını uygular, ardından Next.js sunucusunu başlatır.
#
# `migrate deploy` idempotenttir: yalnızca `_prisma_migrations` tablosunda adı
# bulunmayan migration'ları çalıştırır. Bu yüzden mevcut bir veritabanı dump'ı
# geri yüklendikten sonra çalıştırmak güvenlidir — hiçbir veri değişmez.
set -e

if [ -z "${DATABASE_URL}" ]; then
  echo "entrypoint: DATABASE_URL tanımsız — migration çalıştırılmadan başlatılıyor." >&2
else
  echo "entrypoint: Prisma migration'ları uygulanıyor…"
  node ./node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma
  echo "entrypoint: migration'lar güncel."
fi

exec "$@"
