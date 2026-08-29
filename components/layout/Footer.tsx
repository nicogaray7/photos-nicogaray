import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Container } from './Container';
import { Logo } from './Logo';
import { SocialLinks } from './SocialLinks';

const THEME_COLLECTIONS: { slug: string; labelFr: string; labelEn: string }[] = [
  { slug: 'fonds-decran-mer', labelFr: 'Mer', labelEn: 'Sea' },
  { slug: 'fonds-decran-montagne', labelFr: 'Montagne', labelEn: 'Mountain' },
  { slug: 'fonds-decran-desert', labelFr: 'Désert', labelEn: 'Desert' },
  { slug: 'fonds-decran-coucher-de-soleil', labelFr: 'Coucher de soleil', labelEn: 'Sunset' },
  { slug: 'fonds-decran-tropical', labelFr: 'Tropical', labelEn: 'Tropical' },
];

export function Footer() {
  const locale = useLocale();
  const t = useTranslations('footer');
  const isEn = locale === 'en';
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line mt-20">
      <Container>
        <div className="py-10 sm:py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <Logo href={`/${locale}`} size="md" />
            <p className="text-sm text-ink-muted">{t('rights', { year })}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-muted">
            <Link href={`/${locale}/gallery`} className="hover:text-accent transition-colors">{t('gallery')}</Link>
            <Link href={`/${locale}/map`} className="hover:text-accent transition-colors">{t('map')}</Link>
            <Link href={`/${locale}/about`} className="hover:text-accent transition-colors">{t('about')}</Link>
            <Link href={`/${locale}/guide/fond-decran-iphone`} className="hover:text-accent transition-colors">
              {isEn ? 'Guide' : 'Guide'}
            </Link>
            <Link href={`/${locale}/legal/cgv`} className="hover:text-accent transition-colors">{t('cgv')}</Link>
            <Link href={`/${locale}/legal/license`} className="hover:text-accent transition-colors">{t('license')}</Link>
            <Link href={`/${locale}/legal/mentions`} className="hover:text-accent transition-colors">{t('mentions')}</Link>
          </nav>
        </div>
        <div className="pb-10 sm:pb-14 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
          <span className="uppercase tracking-widest">{isEn ? 'Wallpapers by theme' : "Fonds d'écran par thème"}</span>
          {THEME_COLLECTIONS.map((c) => (
            <Link key={c.slug} href={`/${locale}/collection/${c.slug}`} className="hover:text-accent transition-colors">
              {isEn ? c.labelEn : c.labelFr}
            </Link>
          ))}
          <div className="ml-auto">
            <SocialLinks />
          </div>
        </div>
      </Container>
    </footer>
  );
}
