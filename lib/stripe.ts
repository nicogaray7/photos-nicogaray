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

// Pricing (net price + Stripe processing cost) lives in lib/pricing.ts.
