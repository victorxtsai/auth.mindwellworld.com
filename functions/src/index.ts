import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cookie from 'cookie';
import cors from 'cors';

admin.initializeApp();

const corsHandler = cors({
    origin: true,
    credentials: true,
  });
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5 * 1000; // 5 days

export const createSession = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    const idToken = req.body?.idToken;

    if (!idToken) {
      res.status(401).json({ error: 'Missing or invalid ID token' });
      return;
    }

    try {
      const sessionCookie = await admin.auth().createSessionCookie(idToken, {
        expiresIn: SESSION_COOKIE_MAX_AGE,
      });

      // Dynamically detect cookie domain from origin
      const origin = req.headers.origin || '';
      let cookieDomain = '.mindwell.io';
      if (origin.includes('mindwellworld.com')) {
        cookieDomain = '.mindwellworld.com';
      }
      
      // ✅ Debug logs go here
      console.log('[createSession] origin:', origin);
      console.log('[createSession] setting cookie for domain:', cookieDomain);

      // Set cookie
      res.setHeader('Set-Cookie', cookie.serialize('session', sessionCookie, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        maxAge: SESSION_COOKIE_MAX_AGE / 1000,
      }));

      res.status(200).json({ status: 'success' });
    } catch (error) {
      console.error('[createSession] error', error);
      res.status(401).json({ error: 'Unauthorized' });
    }
  });
});
