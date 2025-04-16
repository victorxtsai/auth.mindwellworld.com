import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');

// Replace with your Stripe Price ID (monthly plan)
const STRIPE_PRICE_ID = 'price_1RCAIACriQ7PjAbj8zaFZhzk'; // ⚠️ REPLACE THIS

export const startStripeCheckoutSession = onRequest(
  { secrets: [STRIPE_SECRET_KEY], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized: Missing Bearer token');
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2025-03-31.basil',
      });

      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const domain = `${protocol}://${host}`;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
        metadata: {
          firebase_uid: uid,
        },
        success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${domain}/cancel`,
      });

      res.status(200).json({ checkoutUrl: session.url });
    } catch (err) {
      logger.error('❌ Failed to create Stripe Checkout session:', err);
      res.status(500).send('Failed to create checkout session');
    }
  }
);
