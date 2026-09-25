import './globals.css';

/**
 * Kök layout bu projede yalnızca `children` döndürür; `<html>`/`<body>`
 * etiketlerini `(site)/layout.tsx` (public site) ve `manage/layout.tsx`
 * (yönetim paneli) ayrı ayrı üretir — ikisi tamamen farklı belge kabukları
 * kullanır (fontlar, tasarım tokenları, robots meta'sı). `globals.css`
 * (Tailwind girişi) burada import edilir ki iki dalın ikisi de aynı
 * derlenmiş yardımcı sınıf setini paylaşsın.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
