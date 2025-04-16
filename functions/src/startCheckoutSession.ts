import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';


export const startCheckoutSession = functions.https.onRequest(async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      functions.logger.error('❌ Missing or invalid Authorization header');
      res.status(401).send('Missing Authorization header');
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { tier } = req.body;
    if (!tier) {
      functions.logger.error('❌ Missing tier in request body');
      res.status(400).send('Missing subscription tier');
      return;
    }

    const rcKey = functions.config().revenuecat.api_key;

    functions.logger.info('✅ Starting checkout for:', { uid, tier });

    const rcRes = await fetch('https://api.revenuecat.com/v1/stripe/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${rcKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_user_id: uid,
        offering_id: tier,
        success_url: 'https://mindwell.io', // where user goes if payment successful
        cancel_url: 'https://mindwellworld.com', // where user goes if payment failes
      }),
    });
    

    const rcData = await rcRes.json() as any;

    if (!rcData?.data?.url) {
      functions.logger.error('❌ Invalid response from RevenueCat:', rcData);
      res.status(500).send('Invalid response from RevenueCat');
      return;
    }

    res.status(200).send({ checkoutUrl: rcData.data.url });
    return;
  } catch (err) {
    functions.logger.error('❌ Unhandled error in startCheckoutSession:', err);
    if (err instanceof Error) {
      res.status(500).send(err.message);
      return;
    } else {
      res.status(500).send('Unexpected server error');
      return;
    }
  }
});
