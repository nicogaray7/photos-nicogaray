import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/Container';
import { prisma } from '@/lib/prisma';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { r2PublicUrl } from '@/lib/r2';
import { ProtectedImg } from '@/components/ProtectedImg';
import { Logo } from '@/components/layout/Logo';
import { getSetting, pickText, type HomeSettings } from '@/lib/settings';
import { HeroCtaLink } from '@/components/analytics/HeroCtaLink';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';

function HomeJsonLd({ locale }: { locale: string }) {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: locale === 'en' ? 'Nico Garay Photography' : 'Nico Garay Photographie',
    url: SITE_URL,
    description:
      locale === 'en'
        ? 'Travel photography in high-resolution digital editions.'
        : 'Photographies de voyage en edition numerique haute resolution.',
    inLanguage: locale === 'en' ? 'en' : 'fr',
  };

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Nico Garay',
    url: 'https://nicogaray.com',
    image: `${SITE_URL}/icon.svg`,
    jobTitle: locale === 'en' ? 'Travel Photographer' : 'Photographe de voyage',
    sameAs: [
      'https://nicogaray.com',
      'https://www.instagram.com/culturspotter/',
      'https://www.pinterest.com/garaynicong/',
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </>
  );
}

async function getFeaturedPhotos() {
  try {
    return await prisma.photo.findMany({
      where: { published: true, featured: true },
      orderBy: [{ takenAt: 'desc' }, { createdAt: 'desc' }],
      take: 6,
    });
  } catch {
    return [];
  }
}

const HERO_KEY = 'hero/main.jpg';

export default async function HomePage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale);
  const [featured, homeSettings] = await Promise.all([
    getFeaturedPhotos(),
    getSetting<HomeSettings>('home'),
  ]);

  return (
    <>
      <HomeJsonLd locale={params.locale} />
      <Hero locale={params.locale} settings={homeSettings} />
      <FeaturedSection photos={featured} locale={params.locale} />
      <AboutTeaser locale={params.locale} />
    </>
  );
}

function Hero({ locale, settings }: { locale: string; settings: HomeSettings | null }) {
  const t = useTranslations('home');
  const heroUrl = r2PublicUrl(HERO_KEY);
  const subtitle = pickText(settings?.subtitle, locale, t('subtitle'));
  const cta = pickText(settings?.cta, locale, t('cta'));

  return (
    <section className="relative min-h-[90vh] flex items-end overflow-hidden bg-ink">
      {heroUrl && (
        <ProtectedImg
          src={heroUrl}
          alt={locale === 'en' ? 'Travel photography by Nico Garay' : 'Photographie de voyage de Nico Garay'}
          className="absolute inset-0 w-full h-full object-cover opacity-90"
        />
      )}
      {/* Bottom scrim for the hero text */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent pointer-events-none" />

      <Container className="relative z-10 pb-16 sm:pb-24">
        <div className="max-w-3xl space-y-6 text-paper">
          <h1 className="animate-fade-up">
            <Logo as="span" size="xl" variant="light" />
          </h1>
          <p className="font-sans text-lg sm:text-2xl text-paper/90 leading-snug max-w-xl animate-fade-up" style={{ animationDelay: '100ms' }}>
            {subtitle}
          </p>
          <div className="pt-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <HeroCtaLink href={`/${locale}/gallery`} label={cta} />
          </div>
        </div>
      </Container>
    </section>
  );
}

function FeaturedSection({ photos, locale }: { photos: Awaited<ReturnType<typeof getFeaturedPhotos>>; locale: string }) {
  const t = useTranslations('home.featured');
  if (photos.length === 0) return null;
  return (
    <section className="py-16 sm:py-24">
      <Container size="wide">
        <div className="flex items-end justify-between mb-8 sm:mb-12">
          <div>
            <h2 className="text-display-lg font-display text-ink">{t('title')}</h2>
          </div>
          <Link
            href={`/${locale}/gallery`}
            className="group inline-flex items-center gap-2 text-sm text-ink-muted hover:text-accent transition-colors"
          >
            {t('cta')}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <MasonryGrid
          photos={photos}
          locale={locale}
          priorityCount={3}
          columnsClass="columns-2 sm:columns-3"
          listId="home_featured"
          listName="Home featured"
        />
      </Container>
    </section>
  );
}

function AboutTeaser({ locale }: { locale: string }) {
  const t = useTranslations('home.about');
  return (
    <section className="py-20 sm:py-28 border-t border-line">
      <Container>
        <div className="max-w-2xl space-y-5">
          <h2 className="text-display-lg font-display text-ink">{t('title')}</h2>
          <p className="prose-feed text-lg">{t('text1')}</p>
          <p className="prose-feed text-lg">{t('text2')}</p>
          <div className="pt-2">
            <Link
              href={`/${locale}/about`}
              className="group inline-flex items-center gap-2 text-sm text-accent hover:text-ink transition-colors"
            >
              {t('cta')}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
