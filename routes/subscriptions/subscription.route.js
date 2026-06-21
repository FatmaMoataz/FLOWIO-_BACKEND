import express from 'express';
import auth from '../../middleware/auth.js';
import {
  createCheckoutSession,
  verifySession,
  stripeWebhook,
} from './subscription.controller.js';

const router = express.Router();

// NOTE: this path needs the RAW request body for Stripe's signature check.
// The raw-body middleware is applied at the app level in server.js for this
// exact path — see SETUP_NOTES.md. Don't add auth here; Stripe calls this
// directly, there's no user session.
router.post('/webhook', stripeWebhook);

router.post('/checkout', auth, createCheckoutSession);
router.get('/session/:sessionId', auth, verifySession);

export default router;