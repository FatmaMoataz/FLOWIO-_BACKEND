import { stripe, PRICE_IDS, PLAN_SEAT_LIMITS } from '../../utils/stripe.js';
import { Company } from '../../models/company.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const createCheckoutSessionService = async ({ company, plan, billingCycle, seats }) => {
  const priceId = PRICE_IDS[plan]?.[billingCycle];
  if (!priceId) {
    throw new Error(`No Stripe price configured for plan "${plan}" (${billingCycle}).`);
  }

  const seatLimit = PLAN_SEAT_LIMITS[plan];
  if (!seats || seats < 1 || seats > seatLimit) {
    throw new Error(`Seats must be between 1 and ${seatLimit} for the ${plan} plan.`);
  }

  // Reuse the Stripe customer across checkout attempts instead of creating
  // a new one every time.
  let stripeCustomerId = company.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: company.name,
      metadata: { companyId: company._id.toString() },
    });
    stripeCustomerId = customer.id;
    company.stripeCustomerId = stripeCustomerId;
    await company.save();
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    client_reference_id: company._id.toString(),
    line_items: [{ price: priceId, quantity: seats }],
    success_url: `${FRONTEND_URL}/onboarding?step=invite&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/onboarding?step=plan&canceled=true`,
    metadata: {
      companyId: company._id.toString(),
      plan,
      billingCycle,
      seats: String(seats),
    },
    subscription_data: {
      metadata: { companyId: company._id.toString(), plan, billingCycle },
    },
  });

  return session;
};

// Called both by the success-page verification call AND by the
// checkout.session.completed webhook — safe to run twice (idempotent update).
export const verifyAndApplySessionService = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription'],
  });

  const isPaid = session.payment_status === 'paid' || session.status === 'complete';
  if (!isPaid) return null;

  const companyId = session.client_reference_id || session.metadata?.companyId;
  if (!companyId) return null;

  const { plan, billingCycle, seats } = session.metadata || {};

  const update = {
    subscriptionStatus: 'active',
    stripeCustomerId: session.customer,
    stripeSubscriptionId:
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id,
  };
  if (plan) update.subscriptionPlan = plan;
  if (billingCycle) update.billingCycle = billingCycle;
  if (seats) update.seats = Number(seats);

  return await Company.findByIdAndUpdate(companyId, update, { new: true });
};

// Handles customer.subscription.updated / .deleted webhook events — keeps
// subscriptionStatus accurate after the initial checkout (e.g. failed
// payment, cancellation at period end, etc).
export const applySubscriptionFromEvent = async (subscriptionObject) => {
  const companyId = subscriptionObject.metadata?.companyId;
  if (!companyId) return;

  const statusMap = {
    active: 'active',
    trialing: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete_expired: 'canceled',
  };

  await Company.findByIdAndUpdate(companyId, {
    subscriptionStatus: statusMap[subscriptionObject.status] || 'none',
    stripeSubscriptionId: subscriptionObject.id,
  });
};

export const setFreePlanService = async (companyId) => {
  return await Company.findByIdAndUpdate(
    companyId,
    {
      subscriptionPlan: 'free',
      billingCycle: null,
      seats: 1,
      subscriptionStatus: 'none',
    },
    { new: true }
  );
};