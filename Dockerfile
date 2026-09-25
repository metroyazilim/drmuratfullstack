# syntax=docker/dockerfile:1

# Dr. Murat Irmak Kliniği — Docker Compose / Dokploy için üretim imajı.
#
# Üç aşama: çalışma zamanı imajı yalnızca standalone sunucu paketini, Prisma
# istemcisini/motorlarını ve açılışta migration uygulamak için gereken Prisma
# CLI'yi taşır. NEXT_PUBLIC_* değerleri `next build` sırasında paketlendiği için
# build arg olarak gelir; tüm sırlar (veritabanı, SMTP, R2) yalnızca çalışma
# zamanında okunur.

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---------------------------------------------------------------- bağımlılıklar
FROM base AS deps
COPY package.json package-lock.json ./
# postinstall `prisma generate` çalıştırdığı için şema kurulumdan önce gerekir.
COPY prisma ./prisma
RUN npm ci

# --------------------------------------------------------------------- builder
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL=https://www.drmuratirmak.com
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------- runner
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# İçerik dosyaları (content/) fallback okuma ve `content:import` için gerekir.
COPY --from=builder --chown=nextjs:nodejs /app/content ./content

COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# R2 tanımlı değilse yerel disk sağlayıcısı buraya yazar; compose bu yolu bir
# volume ile kalıcı hale getirir.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

COPY --chown=nextjs:nodejs docker/entrypoint.sh /app/docker/entrypoint.sh
RUN chmod +x /app/docker/entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["node", "server.js"]
