import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/Container';
import { getFeeModel, priceWithFees, type FeeModel } from '@/lib/pricing';
import { prisma } from '@/lib/prisma';
import { FilterBar } from '@/components/gallery/FilterBar';
import { GalleryTracker } from '@/components/gallery/GalleryTracker';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import type { LightboxPhoto } from '@/components/gallery/GalleryLightbox';
import { r2PublicUrl } from '@/lib/r2-url';
import { COUNTRY_NAMES } from '@/lib/country-names';
import type { Prisma, Photo } from '@prisma/client';

export const dynamic = 'force-dynamic';

interface GallerySearchParams {
  country?: string;
  orientation?: string;
}

async function getCountries(locale: string) {
  try {
    const rows = await prisma.photo.findMany({
      where: { published: true, country: { not: null } },
      select: { country: true, countryCode: true },
      distinct: ['country'],
      orderBy: { country: 'asc' },
    });
    return rows
      .filter((r) => r.country)
      .map((r) => {
        const meta = r.countryCode ? COUNTRY_NAMES[r.countryCode.toUpperCase()] : null;
        const label = meta ? (locale === 'en' ? meta.en : meta.fr) : r.country!;
        return { value: r.country!, label };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    return [];
  }
}

async function getPhotos(params: GallerySearchParams) {
  try {
    const where: Prisma.PhotoWhereInput = { published: true };
    if (params.country) where.country = params.country;
    if (params.orientation) where.orientation = params.orientation;

    const orderBy: Prisma.PhotoOrderByWithRelationInput[] = [{ takenAt: 'desc' }, { createdAt: 'desc' }];

    return await prisma.photo.findMany({ where, orderBy });
  } catch {
    return [];
  }
}

export default async function GalleryPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<GallerySearchParams>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  setRequestLocale(params.locale);
  const [photos, countries, feeModel] = await Promise.all([
    getPhotos(searchParams),
    getCountries(params.locale),
    getFeeModel(),
  ]);
  return <GalleryView photos={photos} countries={countries} feeModel={feeModel} locale={params.locale} />;
}

function GalleryView({
  photos,
  countries,
  feeModel,
  locale,
}: {
  photos: Awaited<ReturnType<typeof getPhotos>>;
  countries: Awaited<ReturnType<typeof getCountries>>;
  feeModel: FeeModel;
  locale: string;
}) {
  const t = useTranslations('gallery');
  const lightboxPhotos = photos.map((p) => toLightboxPhoto(p, locale, feeModel));
  return (
    <>
      <section className="pt-16 pb-10 sm:pt-24 sm:pb-14">
        <Container>
          <div className="max-w-2xl">
            <h1 className="text-display-xl font-display text-ink">{t('title')}</h1>
            <p className="prose-feed text-ink-muted mt-4">{t('subtitle')}</p>
          </div>
        </Container>
      </section>

      <section className="pb-24">
        <Container size="wide">
          <FilterBar countries={countries} total={photos.length} />
          {photos.length === 0 ? (
            <div className="border border-dashed border-line py-32 text-center">
              <p className="caption">{t('empty')}</p>
            </div>
          ) : (
            <>
              <GalleryTracker photos={photos} listId="gallery" listName="Gallery" />
              <GalleryGrid photos={photos} lightboxPhotos={lightboxPhotos} locale={locale} />
            </>
          )}
        </Container>
      </section>
    </>
  );
}

function toLightboxPhoto(photo: Photo, locale: string, feeModel: FeeModel): LightboxPhoto {
  const title = locale === 'en' && photo.titleEn ? photo.titleEn : photo.title;
  const countryName =
    photo.countryCode && COUNTRY_NAMES[photo.countryCode]
      ? COUNTRY_NAMES[photo.countryCode][locale === 'en' ? 'en' : 'fr']
      : photo.country;
  const location = [photo.city, countryName].filter(Boolean).join(', ');
  const dateLabel = photo.takenAt
    ? new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', {
        month: 'long',
        year: 'numeric',
      }).format(photo.takenAt)
    : null;
  return {
    id: photo.id,
    slug: photo.slug,
    url: r2PublicUrl(photo.previewKey) ?? '',
    title,
    location,
    dateLabel,
    width: photo.width,
    height: photo.height,
    price: priceWithFees(photo.price, feeModel),
    currency: photo.currency,
    country: photo.country,
    city: photo.city,
    orientation: photo.orientation,
  };
}
