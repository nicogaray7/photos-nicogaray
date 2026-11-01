import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/Container';
import { prisma } from '@/lib/prisma';
import { r2PublicUrl } from '@/lib/r2';
import { buyerPrice } from '@/lib/stripe';
import { formatPrice } from '@/lib/utils';
import { CheckoutForm } from './CheckoutForm';

// Page transactionnelle (achat d'une photo) : ne doit pas etre indexee (evite
// les doublons "sans canonique" cote Search Console).
export const metadata = { robots: { index: false } };

export const dynamic = 'force-dynamic';

async function getPhoto(id: string) {
  return prisma.photo.findUnique({ where: { id } });
}

export default async function CheckoutPage(props: { params: Promise<{ locale: string; photoId: string }> }) {
  const params = await props.params;
  setRequestLocale(params.locale);
  const photo = await getPhoto(params.photoId);
  if (!photo || !photo.published) notFound();

  // All-in price: the payment processing cost is part of the price, never a
  // separate surcharge line.
  const total = buyerPrice(photo.price);

  return <CheckoutView photo={photo} total={total} locale={params.locale} />;
}

function CheckoutView({
  photo,
  total,
  locale,
}: {
  photo: NonNullable<Awaited<ReturnType<typeof getPhoto>>>;
  total: number;
  locale: string;
}) {
  const t = useTranslations('checkout');
  const tCommon = useTranslations('common');
  const title = locale === 'en' && photo.titleEn ? photo.titleEn : photo.title;
  const thumbUrl = r2PublicUrl(photo.thumbKey) ?? '';
  const intl = locale === 'en' ? 'en-GB' : 'fr-FR';

  return (
    <section className="py-16 sm:py-24">
      <Container size="narrow">
        <Link
          href={`/${locale}/gallery/${photo.slug}`}
          className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase text-ink-muted hover:text-accent transition-colors mb-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {tCommon('back')}
        </Link>

        <header className="space-y-3 mb-10">
          <p className="eyebrow text-accent">{t('title')}</p>
          <h1 className="text-display-lg font-display text-ink">{t('subtitle')}</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <div className="bg-paper border border-line p-6 sm:p-8 space-y-6">
              <p className="eyebrow text-accent">{t('buyer')}</p>
              <CheckoutForm photoId={photo.id} locale={locale} />
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="bg-paper-cool border border-line p-6 sm:p-8 space-y-6">
              <p className="eyebrow text-accent">{t('summary')}</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-paper-dark flex-shrink-0 overflow-hidden">
                  {thumbUrl && <img src={thumbUrl} alt={title} className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-ink font-display">{title}</p>
                  <p className="caption">
                    {[photo.city, photo.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              <dl className="border-t border-line pt-4 space-y-2 text-sm">
                <Row label={title} value={formatPrice(total, photo.currency, intl)} />
                <Row
                  label={t('total')}
                  value={formatPrice(total, photo.currency, intl)}
                  emphasis
                />
              </dl>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}

function Row({
  label,
  value,
  muted,
  emphasis,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={muted ? 'text-ink-muted' : emphasis ? 'text-ink font-medium' : 'text-ink-soft'}>
        {label}
      </dt>
      <dd className={emphasis ? 'text-ink font-display text-lg tabular-nums' : 'text-ink-soft tabular-nums'}>
        {value}
      </dd>
    </div>
  );
}
