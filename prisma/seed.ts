import { AdminRole, PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getAdminBootstrap } from '../src/lib/env';

const prisma = new PrismaClient();

async function seed(): Promise<void> {
  const { email, password } = getAdminBootstrap();
  const existing = await prisma.adminUser.findUnique({ where: { email } });

  if (existing) {
    console.log(`Yönetici zaten var, atlandı: ${email}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({
      data: {
        email,
        passwordHash,
        name: 'Süper Yönetici',
        role: AdminRole.SUPER_ADMIN,
      },
    });
    console.log(`İlk süper yönetici oluşturuldu: ${email}`);
  }

  const settings = await prisma.siteSettings.findUnique({ where: { singleton: true } });
  if (!settings) {
    await prisma.siteSettings.create({ data: { singleton: true } });
    console.log('Site ayarları kaydı oluşturuldu.');
  }
}

seed()
  .catch((error: unknown) => {
    console.error('Veritabanı tohumlama başarısız:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
