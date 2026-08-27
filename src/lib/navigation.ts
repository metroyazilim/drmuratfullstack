/**
 * Menü yapısının tek kaynağı. Header, MobileMenu ve Footer aynı diziyi okur;
 * bir bağlantı eklendiğinde üç yerde birden güncellemek gerekmez.
 *
 * `key` bir messages anahtarıdır — etiketin kendisi asla buraya yazılmaz.
 */
export type NavLeaf = { key: string; href: NavHref };
export type NavGroup = { key: string; children: readonly NavLeaf[] };
export type NavItem = NavLeaf | NavGroup;

export type NavHref =
  | '/'
  | '/about'
  | '/mission'
  | '/vision'
  | '/quality'
  | '/team'
  | '/services'
  | '/blog'
  | '/gallery'
  | '/faq'
  | '/appointment'
  | '/contact';

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

export const mainNav: readonly NavItem[] = [
  { key: 'home', href: '/' },
  { key: 'about', href: '/about' },
  { key: 'services', href: '/services' },
  {
    key: 'corporate',
    children: [
      { key: 'mission', href: '/mission' },
      { key: 'vision', href: '/vision' },
      { key: 'quality', href: '/quality' },
      { key: 'team', href: '/team' },
    ],
  },
  {
    key: 'media',
    children: [{ key: 'gallery', href: '/gallery' }],
  },
  { key: 'blog', href: '/blog' },
  { key: 'contact', href: '/contact' },
] as const;

/** Footer sütunları header menüsüyle birebir aynı değil (tasarım gereği). */
export const footerNav = {
  corporate: [
    { key: 'about', href: '/about' },
    { key: 'mission', href: '/mission' },
    { key: 'vision', href: '/vision' },
    { key: 'quality', href: '/quality' },
    { key: 'team', href: '/team' },
  ],
  quickLinks: [
    { key: 'services', href: '/services' },
    { key: 'gallery', href: '/gallery' },
    { key: 'blog', href: '/blog' },
    { key: 'faq', href: '/faq' },
  ],
} as const satisfies Record<string, readonly NavLeaf[]>;

/*
 * Yasal bağlantılar burada TUTULMAZ: slug dile göre değişiyor ve sabit bir
 * liste, henüz yazılmamış sayfalara 404 linki üretiyordu. Footer bunları
 * içerik katmanından türetir (listEntityIds('legal') + getAlternates).
 */
