import * as functions from 'firebase-functions';

export const startCheckoutSession = functions.https.onRequest(async (req, res) => {
  const { userId, tier } = req.body;

  if (!userId || !tier) {
    res.status(400).send('Missing userId or tier');
    return;
  }

  const RC_API_KEY = functions.config().revenuecat.api_key; // set via: firebase functions:config:set revenuecat.api_key="your_secret"

  try {
    const response = await fetch('https://api.revenuecat.com/v1/stripe/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_user_id: userId,
        offering_id: tier,
        success_url: 'https://auth.mindwellworld.com/success',
        cancel_url: 'https://auth.mindwellworld.com/cancel',
      }),
    });

    const data = await response.json() as { data: { url: string } };

    if (!data?.data?.url) {
      functions.logger.error('[startCheckoutSession] Invalid response from RevenueCat:', data);
      res.status(500).send('Failed to create checkout session');
      return;
    }

    res.status(200).send({ checkoutUrl: data.data.url });
  } catch (err) {
    functions.logger.error('[startCheckoutSession] Error:', err);
    res.status(500).send('Internal Server Error');
  }
});
