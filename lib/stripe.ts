import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Shared Stripe client instance. The API version is pinned explicitly so a
 * Dashboard default change can never alter webhook payloads or responses.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  _stripe = new Stripe(key, { apiVersion: '2026-10-28.endive' });
  return _stripe;
}

/** Stripe product tax code for downloadable digital photos (permanent rights). */
export const PHOTO_TAX_CODE = 'txcd_10501000';

/**
 * Payment processing cost built into the public price: 1.5% + 0.25 EUR
 * (standard EEA cards). Computed so that the seller nets the full `amount`
 * after Stripe's fee.
 *
 * This cost is part of the advertised price, never shown or charged as a
 * separate payment surcharge: surcharging consumer card payments is not
 * allowed in the EU.
 */
export function buyerFees(amount: number): number {
  const rate = 0.015;
  const fixed = 0.25;
  const total = (amount + fixed) / (1 - rate);
  return Math.round((total - amount) * 100) / 100;
}

/** All-in price the buyer sees and pays for a photo whose net price is `amount`. */
export function buyerPrice(amount: number): number {
  return Math.round((amount + buyerFees(amount)) * 100) / 100;
}
