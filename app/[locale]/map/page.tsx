import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { Container } from '@/components/layout/Container';
import { WorldMap } from '@/components/WorldMap';
import { prisma } from '@/lib/prisma';
import { fuzzPublicCoordinate } from '@/lib/geo';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await props.params;
  return {
    alternates: {
      canonical: `/${locale}/map`,
      languages: { fr: '/fr/map', en: '/en/map', 'x-default': '/fr/map' },
    },
  };
}

async function getVisitedCountries(locale: string) {
  const rows = await prisma.photo.groupBy({
    by: ['countryCode'],
    where: { published: true, countryCode: { not: null } },
    _count: { _all: true },
  });

  const codes = rows.map((r) => r.countryCode!).filter(Boolean);
  const countries = await prisma.country.findMany({ where: { code: { in: codes } } });
  const byCode = new Map(countries.map((c) => [c.code, c]));

  return rows
    .map((r) => {
      const c = byCode.get(r.countryCode!);
      return {
        code: r.countryCode!,
        name: c ? (locale === 'en' ? c.nameEn : c.nameFr) : r.countryCode!,
        count: r._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);
}

async function getPhotoDots() {
  const rows = await prisma.photo.findMany({
    where: { published: true, latitude: { not: null }, longitude: { not: null }, countryCode: { not: null } },
    select: { latitude: true, longitude: true, countryCode: true },
  });
  return rows.map((r) => ({
    lat: fuzzPublicCoordinate(r.latitude!),
    lng: fuzzPublicCoordinate(r.longitude!),
    countryCode: r.countryCode!,
  }));
}

export default async function MapPage(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale);
  const [countries, photoDots] = await Promise.all([
    getVisitedCountries(params.locale),
    getPhotoDots(),
  ]);

  return (
    <article>
      <section className="pt-12 pb-6 sm:pt-16 sm:pb-10">
        <Container>
          <div className="max-w-2xl">
            <h1 className="text-display-xl font-display text-ink">
              {params.locale === 'en' ? 'Where I have been' : 'Là où je suis allé'}
            </h1>
            <p className="prose-feed text-ink-muted mt-4">
              {params.locale === 'en'
                ? 'Each red dot is a photo. Click a country to open its gallery.'
                : 'Chaque point rouge est une photo. Cliquez sur un pays pour ouvrir sa galerie.'}
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-14">
        <Container size="wide">
          <WorldMap countries={countries} photoDots={photoDots} locale={params.locale} />
        </Container>
      </section>

      <section className="pb-24">
        <Container size="wide">
          <h2 className="text-display-lg font-display text-ink mb-6">
            {params.locale === 'en' ? 'Countries' : 'Pays'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {countries.map((c) => (
              <Link
                key={c.code}
                href={`/${params.locale}/country/${c.code}`}
                className="group flex items-center justify-between p-4 bg-paper-cool hover:bg-paper-warm transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{flagEmoji(c.code)}</span>
                  <span className="text-sm text-ink group-hover:text-accent transition-colors truncate">{c.name}</span>
                </div>
                <span className="text-xs text-ink-muted whitespace-nowrap">{c.count}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </article>
  );
}

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  const base = 0x1F1E6;
  const A = 'A'.charCodeAt(0);
  return String.fromCodePoint(base + code.charCodeAt(0) - A, base + code.charCodeAt(1) - A);
}
