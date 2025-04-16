import Stripe from "stripe";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export const stripeWebhook = onRequest({ secrets: ["STRIPE_SECRET_KEY", "REVENUECAT_API_KEY"] }, async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig!, endpointSecret);
  } catch (err: any) {
    logger.error("Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.client_reference_id;
    const stripeCustomerId = session.customer;

    logger.log("✅ Stripe checkout complete. Reporting to RevenueCat...", { customerId, stripeCustomerId });

    try {
      const rcRes = await fetch("https://api.revenuecat.com/v1/receipts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.REVENUECAT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_user_id: customerId,
          fetch_token: stripeCustomerId,
          platform: "stripe",
        }),
      });

      const rcData = await rcRes.json();
      if (!rcRes.ok) {
        logger.error("❌ RevenueCat rejected receipt:", rcData);
        res.status(500).send("RevenueCat rejected receipt.");
        return;
      }

      logger.log("✅ RevenueCat receipt accepted:", rcData);
      res.status(200).send("Handled.");
    } catch (err) {
      logger.error("❌ RevenueCat error:", err);
      res.status(500).send("RevenueCat reporting failed.");
    }
  } else {
    logger.log("Unhandled event type:", event.type);
    res.status(200).send("Event ignored.");
  }
});
