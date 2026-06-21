import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('[stripe] STRIPE_SECRET_KEY is not set — subscription endpoints will fail.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Create these as recurring Prices in the Stripe Dashboard (one per plan per
// billing cycle), each configured as a per-seat / "per unit" price, then
// paste the price IDs into your .env. Enterprise has no self-serve price —
// it's handled by sales.
export const PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  },
};

// Mirrors the `limit` values in the frontend's plans array — keep these in
// sync if you ever change one side.
export const PLAN_SEAT_LIMITS = {
  free: 1,
  starter: 5,
  pro: 20,
  enterprise: Infinity,
};