'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getStripe, PHOTO_TAX_CODE } from '@/lib/stripe';
import { getFeeModel, feesFor, priceWithFees } from '@/lib/pricing';

// Tags these sessions in the Stripe Dashboard to compare checkout flows.
const INTEGRATION_IDENTIFIER = 'photo-download-checkout-kqzvtmrw';

const WITHDRAWAL_CONSENT: Record<'fr' | 'en', (cgvUrl: string) => string> = {
  fr: (cgvUrl) =>
    `J'accepte les [CGV](${cgvUrl}) et je demande l'accès immédiat au fichier numérique : je reconnais ainsi renoncer à mon droit de rétractation.`,
  en: (cgvUrl) =>
    `I accept the [terms of sale](${cgvUrl}) and request immediate access to the digital file, and I acknowledge that I thereby waive my right of withdrawal.`,
};

/** Extrait le client_id GA4 du cookie _ga (format GA1.1.<cid1>.<cid2>). */
async function gaClientIdFromCookies(): Promise<string> {
  const ga = (await cookies()).get('_ga')?.value ?? '';
  const parts = ga.split('.');
  return parts.length >= 4 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : '';
}

const schema = z.object({
  photoId: z.string().min(1),
  locale: z.string().min(2),
});

export async function createCheckoutSession(
  raw: z.infer<typeof schema>,
): Promise<{ url?: string; error?: string }> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: 'Invalid input' };
  const { photoId, locale } = parsed.data;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo || !photo.published) return { error: 'Photo not found' };

  // The all-in price shown on the site: the payment processing cost is part
  // of the price, not a surcharge. `fees` is kept on the Order for accounting.
  const feeModel = await getFeeModel();
  const fees = feesFor(photo.price, feeModel);
  const total = priceWithFees(photo.price, feeModel);

  // Create the Order first so we can reference it in Stripe metadata.
  // Buyer details (email, name, phone) are filled in by the webhook once
  // Stripe Checkout has collected them natively.
  const order = await prisma.order.create({
    data: {
      photoId: photo.id,
      amount: photo.price,
      fees,
      total,
      currency: photo.currency,
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://photos.nicogaray.com';
  const stripe = getStripe();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    // No payment_method_types: dynamic payment methods (cards, Apple Pay,
    // Google Pay, Link...) are managed from the Stripe Dashboard.
    locale: lang,
    integration_identifier: INTEGRATION_IDENTIFIER,
    // Show the price in the buyer's local currency when relevant.
    adaptive_pricing: { enabled: true },
    // EU consumer law: digital content delivered immediately requires the
    // buyer's express consent to waive the withdrawal right.
    consent_collection: { terms_of_service: 'required' },
    custom_text: {
      terms_of_service_acceptance: {
        message: WITHDRAWAL_CONSENT[lang](`${siteUrl}/${lang}/legal/cgv`),
      },
    },
    // Post-purchase invoice emailed by Stripe and downloadable by the buyer.
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: photo.title,
        metadata: { orderId: order.id, photoId: photo.id },
      },
    },
    // Stripe-native collection of customer details
    billing_address_collection: 'required',
    phone_number_collection: { enabled: true },
    customer_creation: 'always',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: photo.currency.toLowerCase(),
          unit_amount: Math.round(total * 100),
          product_data: {
            name: photo.title,
            description: photo.description ?? undefined,
            tax_code: PHOTO_TAX_CODE,
          },
        },
      },
    ],
    metadata: {
      orderId: order.id,
      photoId: photo.id,
      locale,
      gaClientId: await gaClientIdFromCookies(),
    },
    success_url: `${siteUrl}/${locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${locale}/gallery/${photo.slug}`,
  });

  if (!session.url) return { error: 'Stripe session failed' };

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: session.id },
  });

  return { url: session.url };
}
