import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const startCheckoutSession = functions.https.onRequest(async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send('Missing or invalid Authorization header');
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  let firebaseUID = '';
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    firebaseUID = decodedToken.uid;
  } catch (err) {
    functions.logger.error('[startCheckoutSession] Invalid token:', err);
    res.status(403).send('Invalid Firebase token');
    return;
  }

  const { tier } = req.body;
  if (!tier) {
    res.status(400).send('Missing tier');
    return;
  }

  const RC_API_KEY = functions.config().revenuecat.api_key;

  try {
    const response = await fetch('https://api.revenuecat.com/v1/stripe/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_user_id: firebaseUID,
        offering_id: tier,
        success_url: 'https://mindwell.io', // where user goes if payment successful
        cancel_url: 'https://mindwellworld.com', // where user goes if payment failes
      }),
    });

    const data = await response.json() as { data?: { url?: string } };

    if (!data?.data?.url) {
      functions.logger.error('[startCheckoutSession] Invalid RevenueCat response:', data);
      res.status(500).send('Failed to create checkout session');
      return;
    }

    // Optionally: Redirect directly instead of returning JSON
    res.status(200).send({ checkoutUrl: data.data.url });
    return;
  } catch (err) {
    functions.logger.error('[startCheckoutSession] Error:', err);
    res.status(500).send('Internal Server Error');
    return;
  }
});