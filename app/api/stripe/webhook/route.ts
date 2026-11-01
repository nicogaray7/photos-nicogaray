import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendPurchaseEmail } from '@/lib/email';
import { sendPurchaseToGA4 } from '@/lib/ga-mp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('[stripe] invalid signature', err);
    return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    const locale = (session.metadata?.locale === 'en' ? 'en' : 'fr') as 'fr' | 'en';
    if (!orderId) return NextResponse.json({ received: true });

    // Delayed-notification payment methods (e.g. SEPA Direct Debit) complete
    // the session while it is still unpaid. Fulfil only once the money is
    // confirmed; that later arrives as checkout.session.async_payment_succeeded.
    if (session.payment_status === 'unpaid') {
      return NextResponse.json({ received: true });
    }

    const expiryHours = Number(process.env.DOWNLOAD_TOKEN_EXPIRY_HOURS ?? 48);
    const downloadExpiry = new Date(Date.now() + expiryHours * 3600 * 1000);

    // Buyer details collected natively by Stripe Checkout
    const cd = session.customer_details;
    const buyerEmail = cd?.email ?? session.customer_email ?? null;
    const buyerName = cd?.name ?? null;
    const buyerPhone = cd?.phone ?? null;
    const buyerCountry = cd?.address?.country ?? null;

    // Idempotency: Stripe may deliver this event more than once. Only the
    // first transition pending -> paid should fulfil the order and email the
    // buyer. updateMany with a paymentStatus guard makes this atomic.
    const claimed = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: 'paid' } },
      data: { paymentStatus: 'paid', paidAt: new Date() },
    });
    if (claimed.count === 0) {
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'paid',
        paidAt: new Date(),
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        downloadExpiry,
        buyerEmail,
        buyerName,
        buyerPhone,
        buyerCountry,
      },
      include: { photo: true },
    });

    if (buyerEmail) {
      await sendPurchaseEmail({
        to: buyerEmail,
        photoTitle: order.photo.title,
        downloadToken: order.downloadToken,
        total: order.total,
        currency: order.currency,
        paymentIntentId: order.stripePaymentIntentId,
        locale,
      }).catch((err) => console.error('[email] send failed', err));
    }

    // Filet de sécurité GA4 : purchase server-side via Measurement Protocol.
    // Dédupliqué par transaction_id (= order.id) avec le purchase client-side.
    await sendPurchaseToGA4({
      clientId: session.metadata?.gaClientId ?? '',
      transactionId: order.id,
      value: order.total,
      currency: order.currency,
      items: [
        {
          item_id: order.photo.slug,
          item_name: order.photo.title,
          price: order.total,
          quantity: 1,
          item_category: order.photo.country ?? undefined,
          item_variant: order.photo.orientation ?? undefined,
        },
      ],
    }).catch((err) => console.error('[ga4-mp] purchase send failed', err));
  } else if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (orderId) {
      // Guard: an out-of-order event must never downgrade a paid order.
      await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: { not: 'paid' } },
        data: { paymentStatus: 'failed' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
