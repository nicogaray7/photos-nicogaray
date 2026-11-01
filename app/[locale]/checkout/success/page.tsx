import { createHash } from 'crypto';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { setRequestLocale } from 'next-intl/server';
import { useTranslations } from 'next-intl';
import { Container } from '@/components/layout/Container';
import { prisma } from '@/lib/prisma';
import { PurchaseTracker } from '@/components/analytics/PurchaseTracker';

// Page de confirmation d'achat : ne doit pas etre indexee.
export const metadata = { robots: { index: false } };

export const dynamic = 'force-dynamic';

// Enhanced match Pinterest : email hashe cote serveur, jamais transmis en clair au client.
function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

async function getOrder(sessionId: string) {
  return prisma.order.findFirst({
    where: { stripeSessionId: sessionId },
    include: {
      photo: {
        select: { id: true, slug: true, title: true, country: true, city: true, orientation: true },
      },
    },
  });
}

export default async function CheckoutSuccessPage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ session_id?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  setRequestLocale(params.locale);
  const order = searchParams.session_id ? await getOrder(searchParams.session_id) : null;
  return (
    <SuccessView
      locale={params.locale}
      token={order?.downloadToken}
      photoTitle={order?.photo.title}
      tracking={
        order
          ? {
              transactionId: order.id,
              total: order.total,
              photo: {
                id: order.photo.id,
                slug: order.photo.slug,
                title: order.photo.title,
                price: order.total,
                currency: order.currency,
                country: order.photo.country,
                city: order.photo.city,
                orientation: order.photo.orientation,
              },
              hashedEmail: order.buyerEmail ? hashEmail(order.buyerEmail) : undefined,
            }
          : undefined
      }
    />
  );
}

function SuccessView({
  locale,
  token,
  photoTitle,
  tracking,
}: {
  locale: string;
  token?: string;
  photoTitle?: string;
  tracking?: {
    transactionId: string;
    total: number;
    photo: import('@/lib/analytics').PhotoLike;
    hashedEmail?: string;
  };
}) {
  const t = useTranslations('checkout.success');
  return (
    <section className="min-h-[70vh] flex items-center py-24">
      {tracking && (
        <PurchaseTracker
          transactionId={tracking.transactionId}
          total={tracking.total}
          photo={tracking.photo}
          hashedEmail={tracking.hashedEmail}
        />
      )}
      <Container size="narrow">
        <div className="text-center space-y-8">
          <CheckCircle2 className="w-16 h-16 text-accent mx-auto" />
          <div className="space-y-3">
            <p className="eyebrow text-accent">Confirmation</p>
            <h1 className="text-display-lg font-display text-ink">{t('title')}</h1>
            {photoTitle && <p className="prose-editorial">{photoTitle}</p>}
            <p className="prose-editorial">{t('subtitle')}</p>
          </div>
          {token ? (
            <Link
              href={`/${locale}/download/${token}`}
              className="inline-flex items-center gap-3 px-9 py-4 bg-ink text-paper text-[11px] tracking-widest uppercase hover:bg-accent transition-colors duration-300 group"
            >
              {t('download')}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          ) : (
            <p className="caption">{t('email')}</p>
          )}
          <p className="caption">{t('expiry')}</p>
          <p className="caption">{t('email')}</p>
        </div>
      </Container>
    </section>
  );
}
