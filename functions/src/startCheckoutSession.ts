import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as functions from 'firebase-functions';

// Define your secret
const REVENUECAT_API_KEY = defineSecret('REVENUECAT_API_KEY');

export const startCheckoutSession = onRequest(
  {
    secrets: [REVENUECAT_API_KEY],
    region: 'us-central1', // Specify your desired region
    timeoutSeconds: 60,    // Set timeout as needed
    memory: '256MiB',      // Set memory allocation as needed
  },
  async (req, res) => {
    try {
      // Verify Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).send('Missing Authorization header');
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Get tier from request body
      const { tier } = req.body;
      if (!tier) {
        res.status(400).send('Missing subscription tier');
        return;
      }

      const rcKey = REVENUECAT_API_KEY.value();

      // Call RevenueCat API
      const rcRes = await fetch('https://api.revenuecat.com/v1/stripe/checkout_sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${rcKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_user_id: uid,
          offering_id: tier,
          success_url: 'https://mindwell.io/',
          cancel_url: 'https://mindwell.io/',
        }),
      });

      // Always log the raw response body, not parsed yet
      const rawBody = await rcRes.text();
      functions.logger.error('❌ RevenueCat raw response body:', rawBody);

      // Try to parse
      let rcData: any;
      try {
        rcData = JSON.parse(rawBody);
      } catch (err) {
        functions.logger.error('❌ Failed to parse RevenueCat JSON:', err);
        res.status(500).send('Invalid JSON from RevenueCat');
        return;
      }

      // Log status for better debugging
      functions.logger.error('❌ RevenueCat status:', rcRes.status);

      if (!rcRes.ok || !rcData?.data?.url) {
        functions.logger.error('❌ Invalid or unexpected response from RevenueCat:', rcData);
        res.status(500).send(`RevenueCat error: ${rcData?.message || 'Unknown error'}`);
        return;
      }

      res.status(200).send({ checkoutUrl: rcData.data.url });
    } catch (err) {
      console.error('Error starting checkout session:', err);
      res.status(500).send('Unexpected server error');
    }
  }
);
