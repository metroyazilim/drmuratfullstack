import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { fontSans } from '@/lib/fonts';
import './admin.css';

export const metadata: Metadata = {
  title: {
    default: 'Yönetim Paneli | Dr. Murat Irmak',
    template: '%s | Klinik Yönetimi',
  },
  robots: { index: false, follow: false },
};

/**
 * Panelin kendi belge kabuğu. Kök layout yalnızca `children` döndürür;
 * bu dal belgeyi Türkçe ve soldan sağa olacak şekilde kendisi kurar.
 * `/manage` sunucu tarafında oturum kapısıyla korunur.
 *
 * SONUÇ: `<html>` kökte değil, iç içe bir layout'ta üretildiği için React'in
 * akış (streaming) sırasında kullandığı Suspense açığa çıkarma scripti bu alt
 * ağaçta çalışmaz. Bu yüzden `/manage` altında SUNUCU tarafı Suspense sınırı
 * (yani `loading.tsx`) KULLANILMAZ — iskelet ekranda takılı kalır. Panel
 * `force-dynamic` ve sorguları milisaniyeler sürdüğü için bir kaybı yok.
 * İstemci tarafı Suspense (örn. `useSearchParams` sarmalayıcısı) sorunsuz.
 */
export default function ManageLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" dir="ltr" className={fontSans.variable}>
      <body className="admin-root bg-bg-surface font-sans text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
