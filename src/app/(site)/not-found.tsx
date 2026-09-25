import { getTranslations } from '@/lib/strings';
import { Container } from '@/components/ui/container';
import { Section } from '@/components/ui/section';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/site-routes';

/**
 * 404 sayfası kabuğun İÇİNDE kalır: header, footer ve menü görünür,
 * böylece kullanıcı siteye dönüş yolunu kaybetmez.
 */
export default async function NotFound() {
  const t = await getTranslations('error');

  return (
    <Section variant="base">
      <Container>
        <div className="mx-auto max-w-xl py-16 text-center">
          <p className="text-accent-primary text-6xl font-bold tracking-tight">404</p>
          <h1 className="text-text-primary mt-4 text-2xl font-bold tracking-tight md:text-3xl">
            {t('notFoundTitle')}
          </h1>
          <p className="text-text-muted mt-3 text-sm leading-relaxed">
            {t('notFoundBody')}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/">
              <Button variant="primary">{t('backHome')}</Button>
            </Link>
            <Link href="/services">
              <Button variant="secondary">{t('viewServices')}</Button>
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
