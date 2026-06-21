import { Company } from '../../models/company.js';
import { stripe } from '../../utils/stripe.js';
import {
  createCheckoutSessionService,
  verifyAndApplySessionService,
  applySubscriptionFromEvent,
  setFreePlanService,
} from './subscription.service.js';

export const createCheckoutSession = async (req, res) => {
  try {
    const { plan, billingCycle = 'monthly', seats = 1 } = req.body;

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    if (plan === 'free') {
      const updated = await setFreePlanService(company._id);
      return res.status(200).json({ success: true, free: true, data: updated });
    }

    if (plan === 'enterprise') {
      return res.status(400).json({
        success: false,
        message: 'Enterprise plans require contacting sales — no self-serve checkout.',
      });
    }

    const session = await createCheckoutSessionService({ company, plan, billingCycle, seats });
    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error('[POST /subscriptions/checkout]', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// The frontend calls this right after the user lands back on
// /onboarding?session_id=... so the UI can update immediately without
// waiting on the webhook (which can lag a few seconds, especially locally).
export const verifySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const updatedCompany = await verifyAndApplySessionService(sessionId);
    if (!updatedCompany) {
      return res.status(400).json({ success: false, message: 'Session is not paid/complete yet.' });
    }
    return res.status(200).json({ success: true, data: updatedCompany });
  } catch (error) {
    console.error('[GET /subscriptions/session/:sessionId]', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

// IMPORTANT: Stripe signs the raw request body. This route must receive the
// RAW body, not the JSON-parsed one — see SETUP_NOTES.md for the exact
// server.js wiring (express.raw() on this path, mounted before express.json()).
export const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('[Stripe webhook] signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await verifyAndApplySessionService(event.data.object.id);
        break;
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await applySubscriptionFromEvent(event.data.object);
        break;
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Stripe webhook] handler error for ${event.type}:`, error);
    return res.status(500).json({ received: false });
  }
};