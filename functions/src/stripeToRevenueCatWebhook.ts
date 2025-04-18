// import Stripe from "stripe";
// import { onRequest } from "firebase-functions/v2/https";
// import * as logger from "firebase-functions/logger";
// import { defineSecret } from 'firebase-functions/params';

// const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
// const REVENUECAT_API_KEY = defineSecret('REVENUECAT_API_KEY');

// export const stripeToRevenueCatWebhook = onRequest(
//   { secrets: [STRIPE_SECRET_KEY, REVENUECAT_API_KEY], cors: true },
//   async (req, res) => {
//     const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
//       apiVersion: "2025-03-31.basil", // ✅ fallback if "2025-03-31.basil" causes errors
//     });

//     const sig = req.headers["stripe-signature"];
//     const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

//     let event;
//     try {
//       event = stripe.webhooks.constructEvent(req.rawBody, sig!, endpointSecret!);
//     } catch (err: any) {
//       logger.error("❌ Webhook Error:", err.message);
//       res.status(400).send(`Webhook Error: ${err.message}`);
//       return;
//     }

//     if (event.type === "checkout.session.completed") {
//       const session = event.data.object as Stripe.Checkout.Session;
//       const customerId = session.client_reference_id;
//       const stripeCustomerId = session.customer;

//       logger.log("✅ Stripe checkout complete. Reporting to RevenueCat...", {
//         customerId,
//         stripeCustomerId,
//       });

//       try {
//         const rcRes = await fetch("https://api.revenuecat.com/v1/receipts", {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${REVENUECAT_API_KEY.value()}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             app_user_id: customerId,
//             fetch_token: stripeCustomerId,
//             platform: "stripe",
//           }),
//         });

//         const rcData = await rcRes.json();

//         if (!rcRes.ok) {
//           logger.error("❌ RevenueCat rejected receipt:", rcData);
//           res.status(500).send("RevenueCat rejected receipt.");
//           return;
//         }

//         logger.log("✅ RevenueCat receipt accepted:", rcData);
//         res.status(200).send("Handled.");
//       } catch (err) {
//         logger.error("❌ RevenueCat error:", err);
//         res.status(500).send("RevenueCat reporting failed.");
//       }
//     } else {
//       logger.log("⚠️ Unhandled event type:", event.type);
//       res.status(200).send("Event ignored.");
//     }
//   }
// );
