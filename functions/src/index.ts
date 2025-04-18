import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cookie from 'cookie';
import corsLib from 'cors';

admin.initializeApp();

export { startCheckoutSession } from './startCheckoutSession';
export { revenuecatWebhook } from './revenuecatWebhook';
// export { stripeToRevenueCatWebhook } from './stripeToRevenueCatWebhook';
export { startStripeCheckoutSession } from './startStripeCheckoutSession';

const cors = corsLib({ origin: true, credentials: true });

export const setSession_Auth_MindwellWorld_Com = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const token = req.query.token as string;
      const redirect = req.query.redirect as string || 'https://mindwell.io';

      if (!token) {
        res.status(400).send('Missing token');
        return;
      }

      const sessionCookie = await admin.auth().createSessionCookie(token, {
        expiresIn: 60 * 60 * 24 * 5 * 1000, // 5 days
      });

      // Set secure, cross-site session cookie
      res.setHeader(
        'Set-Cookie',
        cookie.serialize('session', sessionCookie, {
          httpOnly: true,
          secure: true,
          sameSite: 'none', // Required for cross-site usage
          path: '/',
          maxAge: 60 * 60 * 24 * 5,
        })
      );

      // Redirect to the original destination, or deep link if applicable
      if (redirect.startsWith('mindwellapp://')) {
        // Deep link to mobile
        res.redirect(302, `${redirect}?token=${token}`);
      } else {
        // Web redirect
        const encodedRedirect = encodeURIComponent(redirect);
        res.redirect(`/redirect?redirect=${encodedRedirect}`);
      }
    } catch (err) {
      console.error('[setSession_Auth_MindwellWorld_Com] Error:', err);
      res.status(500).send('Failed to create session');
    }
  });
});

export const checkAuth_Auth_MindwellWorld_Com = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const cookies = cookie.parse(req.headers.cookie || '');
    const session = cookies.session || '';

    try {
      const decoded = await admin.auth().verifySessionCookie(session, true);
      res.status(200).send({ uid: decoded.uid, email: decoded.email });
    } catch (error) {
      res.status(401).send('Unauthorized');
    }
  });
});

export const logout_Auth_MindwellWorld_Com = functions.https.onRequest((req, res) => {
  res.setHeader(
    'Set-Cookie',
    cookie.serialize('session', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      expires: new Date(0), // Immediately expire
    })
  );

  // CORS headers (broad for now, you can tighten later)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  res.status(200).send('Logged out');
});
