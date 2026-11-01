import { getSetting, setSetting } from './settings';

/**
 * Self-calibrating model of Stripe's processing fee, used to compute the
 * all-in price a buyer pays so that the seller nets the photo's price.
 *
 * Stripe exposes no API for an account's pricing, so the model starts from
 * Stripe's standard EEA card rate and is then refitted after every paid
 * order from the fee Stripe actually deducted (balance transaction). When
 * Stripe's fees change, or the mix of cards/payment methods shifts, prices
 * follow automatically.
 *
 * The fee is part of the advertised price and is never shown to buyers as a
 * separate surcharge (surcharging consumer card payments is banned in the EU).
 */

export interface FeeSample {
  /** Gross amount charged, in major units of the settlement currency. */
  gross: number;
  /** Stripe fee actually deducted, in major units. */
  fee: number;
  at: string;
}

export interface FeeModel {
  /** Proportional part of the fee (0.015 = 1.5%). */
  percent: number;
  /** Fixed part of the fee, in major units. */
  fixed: number;
  source: 'default' | 'observed';
  samples: FeeSample[];
  updatedAt: string;
}

const SETTING_KEY = 'stripe.feeModel';
const MAX_SAMPLES = 30;
/** Minimum spread of gross amounts needed to fit both fee components. */
const MIN_SPREAD_FOR_FULL_FIT = 1;

function envNumber(name: string, fallback: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

/** Starting point before any real payment has been observed. */
export function defaultFeeModel(): FeeModel {
  return {
    percent: envNumber('STRIPE_FEE_PERCENT', 0.015),
    fixed: envNumber('STRIPE_FEE_FIXED', 0.25),
    source: 'default',
    samples: [],
    updatedAt: new Date(0).toISOString(),
  };
}

export async function getFeeModel(): Promise<FeeModel> {
  const stored = await getSetting<FeeModel>(SETTING_KEY);
  if (!stored || !Number.isFinite(stored.percent) || !Number.isFinite(stored.fixed)) {
    return defaultFeeModel();
  }
  return stored;
}

/**
 * All-in price for a photo whose net price is `net`: the smallest amount
 * (rounded up to the cent) that leaves `net` after the modelled Stripe fee.
 */
export function priceWithFees(net: number, model: FeeModel): number {
  const gross = (net + model.fixed) / (1 - model.percent);
  // Round up to the cent; the epsilon absorbs floating-point noise.
  return Math.ceil(gross * 100 - 1e-6) / 100;
}

/** Processing cost built into the price (kept on the Order for accounting). */
export function feesFor(net: number, model: FeeModel): number {
  return Math.round((priceWithFees(net, model) - net) * 100) / 100;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Refit the fee components from observed payments. Pure, exported for tests. */
export function fitFeeModel(samples: FeeSample[], previous: FeeModel): Pick<FeeModel, 'percent' | 'fixed'> {
  const usable = samples.filter((s) => s.gross > 0 && s.fee >= 0);
  if (usable.length === 0) return { percent: previous.percent, fixed: previous.fixed };

  const grosses = usable.map((s) => s.gross);
  const spread = Math.max(...grosses) - Math.min(...grosses);

  if (usable.length >= 3 && spread >= MIN_SPREAD_FOR_FULL_FIT) {
    // Least squares on fee = percent * gross + fixed.
    const n = usable.length;
    const mx = grosses.reduce((a, b) => a + b, 0) / n;
    const my = usable.reduce((a, s) => a + s.fee, 0) / n;
    let sxy = 0;
    let sxx = 0;
    for (const s of usable) {
      sxy += (s.gross - mx) * (s.fee - my);
      sxx += (s.gross - mx) ** 2;
    }
    const percent = sxx > 0 ? sxy / sxx : previous.percent;
    const fixed = my - percent * mx;
    if (percent >= 0 && percent < 0.2 && fixed >= 0 && fixed < 2) {
      return { percent, fixed };
    }
  }

  // Prices cluster around one amount: both components can't be told apart,
  // so keep the fixed part and fit the average proportional part. The model
  // then reproduces the observed fee at the amounts actually charged.
  const fixed = previous.fixed;
  const percent =
    usable.reduce((a, s) => a + (s.fee - fixed) / s.gross, 0) / usable.length;
  return { percent: clamp(percent, 0, 0.2), fixed };
}

/** Record the fee Stripe actually took on a payment and refit the model. */
export async function recordObservedFee(gross: number, fee: number): Promise<FeeModel> {
  const current = await getFeeModel();
  const samples = [...current.samples, { gross, fee, at: new Date().toISOString() }].slice(
    -MAX_SAMPLES,
  );
  const fitted = fitFeeModel(samples, current);
  const next: FeeModel = {
    ...fitted,
    source: 'observed',
    samples,
    updatedAt: new Date().toISOString(),
  };
  await setSetting(SETTING_KEY, next);
  return next;
}
