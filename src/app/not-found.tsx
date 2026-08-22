/**
 * Genel 404 sayfası.
 *
 * NOT: `[locale]/not-found.tsx` locale kabuğunun (header/footer/float
 * butonlar) içinde render EDİLEMİYOR. Sebep: kök `app/layout.tsx`
 * `<html>`/`<body>` üretmiyor (onları `[locale]/layout.tsx` üretiyor,
 * çünkü `lang` ve `dir` locale'e bağlı). `notFound()` tetiklendiğinde
 * Next geçerli bir belge kabuğu bulamıyor ve kendi hata belgesini
 * kullanıyor — next-intl'in bilinen kısıtı.
 *
 * Bu yüzden 404 kendi belgesini üretiyor ve markayı, mesajı ve dönüş
 * yollarını kendisi taşıyor. Kullanıcı siteye dönüş yolunu kaybetmiyor.
 * Dört dile birden hitap etmesi için metinler TR + EN olarak veriliyor;
 * bu sayfa çeviri katmanına erişemiyor.
 */
const BRAND = '#3372E6';
const TEXT = '#141615';
const MUTED = '#5D6162';
const BORDER = '#E3E6EB';

const links = [
  { href: '/tr', label: 'Türkçe' },
  { href: '/en', label: 'English' },
  { href: '/ar', label: 'العربية' },
  { href: '/ru', label: 'Русский' },
];

export default function RootNotFound() {
  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: TEXT,
          background: '#fff',
          padding: '2rem',
        }}
      >
        <main style={{ textAlign: 'center', maxWidth: 460 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: '2rem',
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: BRAND,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
              }}
            >
              D
            </span>
            <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              Dr. Murat Irmak
            </span>
          </div>

          <p style={{ color: BRAND, fontSize: '3rem', fontWeight: 700, margin: 0 }}>
            404
          </p>
          <h1 style={{ fontSize: '1.25rem', margin: '0.75rem 0 0' }}>
            Sayfa bulunamadı
          </h1>
          <p style={{ color: MUTED, fontSize: '0.9rem', margin: '0.4rem 0 0' }}>
            Page not found · الصفحة غير موجودة · Страница не найдена
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              justifyContent: 'center',
              marginTop: '2rem',
            }}
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  padding: '0.55rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: TEXT,
                  textDecoration: 'none',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          <p style={{ color: MUTED, fontSize: '0.8rem', marginTop: '1.75rem' }}>
            <a href="tel:+905421883034" style={{ color: BRAND, textDecoration: 'none' }}>
              0542 188 30 34
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
