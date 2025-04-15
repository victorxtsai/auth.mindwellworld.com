import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const revenuecatWebhook = functions.https.onRequest(async (req, res) => {
  const event = req.body;

  const {
    event: eventType,
    app_user_id,
    expiration_at_ms,
    product_id,
  } = event;

  functions.logger.info(`[RevenueCat Webhook] Event: ${eventType}`, event);

  if (!app_user_id) {
    res.status(400).send('Missing app_user_id');
    return;
  }

  const subscriptionStatus = {
    tier: product_id,
    active: ['INITIAL_PURCHASE', 'RENEWAL'].includes(eventType),
    expiresAt: expiration_at_ms ? new Date(expiration_at_ms).toISOString() : null,
    eventType,
    lastUpdated: new Date().toISOString(),
  };

  try {
    await admin.firestore().collection('users').doc(app_user_id).set(
      {
        subscription: subscriptionStatus,
      },
      { merge: true }
    );

    res.status(200).send('OK');
  } catch (err) {
    functions.logger.error('[RevenueCat Webhook] Error updating Firestore:', err);
    res.status(500).send('Failed to update subscription status');
  }
});
