import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  CircleHelp,
  House,
  Images,
  Inbox,
  LayoutDashboard,
  Library,
  List,
  Newspaper,
  Route,
  Scale,
  Search,
  ScrollText,
  Settings,
  Stethoscope,
  UserCog,
  Users,
} from 'lucide-react';

export type AdminNavItem = Readonly<{
  href: string;
  label: string;
  icon: LucideIcon;
  requiresSuperAdmin?: boolean;
}>;

export type AdminNavGroup = Readonly<{
  title: string;
  items: readonly AdminNavItem[];
}>;

export const NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    title: 'Genel',
    items: [{ href: '/manage', label: 'Gösterge paneli', icon: LayoutDashboard }],
  },
  {
    title: 'İçerik',
    items: [
      { href: '/manage/icerik/hizmetler', label: 'Hizmetler', icon: Stethoscope },
      { href: '/manage/icerik/blog', label: 'Blog', icon: Newspaper },
      { href: '/manage/icerik/ekip', label: 'Ekip', icon: Users },
      { href: '/manage/icerik/kurumsal', label: 'Kurumsal sayfalar', icon: Building2 },
      { href: '/manage/icerik/yasal', label: 'Yasal metinler', icon: Scale },
    ],
  },
  {
    title: 'Sayfa metinleri',
    items: [
      { href: '/manage/sayfa-metinleri/anasayfa', label: 'Anasayfa', icon: House },
      { href: '/manage/sayfa-metinleri/liste', label: 'Liste sayfaları', icon: List },
      { href: '/manage/sayfa-metinleri/sss', label: 'SSS', icon: CircleHelp },
      { href: '/manage/sayfa-metinleri/galeri', label: 'Galeri', icon: Images },
    ],
  },
  {
    title: 'SEO',
    items: [
      { href: '/manage/seo', label: 'SEO çalışma alanı', icon: Search },
      { href: '/manage/yonlendirmeler', label: 'Yönlendirmeler', icon: Route },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { href: '/manage/medya', label: 'Medya', icon: Library },
      { href: '/manage/talepler', label: 'Talepler', icon: Inbox },
      { href: '/manage/ayarlar', label: 'Ayarlar', icon: Settings },
      {
        href: '/manage/kullanicilar',
        label: 'Kullanıcılar',
        icon: UserCog,
        requiresSuperAdmin: true,
      },
      { href: '/manage/islem-kaydi', label: 'İşlem kaydı', icon: ScrollText },
    ],
  },
];

const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items);

export function findNavItemByPath(pathname: string): AdminNavItem | null {
  if (pathname === '/manage') return NAV_ITEMS[0] ?? null;

  return (
    NAV_ITEMS.filter(
      (item) => item.href !== '/manage' && pathname.startsWith(`${item.href}/`),
    ).sort((left, right) => right.href.length - left.href.length)[0] ??
    NAV_ITEMS.find((item) => item.href === pathname) ??
    null
  );
}
