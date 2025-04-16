import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User,
} from 'firebase/auth';
import { auth } from '@/src/firebaseConfig';


export const callCreateSession = async (user: User, redirectUrl: string = '/') => {
  const idToken = await user.getIdToken();

  const fallbackDomain = 'mindwell.io';
  const mobileAppURL = `mindwellapp://setSession?token=${idToken}`;
  const fallbackWebURL = `https://${fallbackDomain}/redirect?token=${idToken}`;

  try {
    if (redirectUrl) {
      const url = new URL(redirectUrl, `https://${fallbackDomain}`);
      const domain = url.hostname;

      const allowedDomains = [
        'mindwell.io',
        'mel.mindwell.io',
        'mel.ai',
        'mindwellworld.com',
        'auth.mindwellworld.com',
      ];

      const isValidDomain = allowedDomains.includes(domain);
      const isMobileDeepLink = redirectUrl.startsWith('mindwellapp://');

      if (isValidDomain && !isMobileDeepLink) {
        // ✅ Redirect back to original allowed domain
        window.location.href = `https://${domain}/redirect?token=${idToken}&redirect=${encodeURIComponent(redirectUrl)}`;
        return;
      }
    }

    // 🚨 If redirect is invalid or not allowed, try mobile deep link
    window.location.href = mobileAppURL;

    // 🛑 If mobile app doesn’t open it, fallback to mindwell.io
    setTimeout(() => {
      window.location.href = fallbackWebURL;
    }, 1500);
  } catch (err) {
    // 🔁 Total fallback
    window.location.href = fallbackWebURL;
  }
};




export function useFirebaseAuth() {
  const login = async (
    email: string,
    password: string,
    redirectUrl: string = '/',
    rememberMe: boolean
  ) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await callCreateSession(userCredential.user, redirectUrl);
  };

  const register = async (email: string, password: string, redirectUrl: string = '/') => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    await callCreateSession(userCredential.user, redirectUrl);
  };

  const loginWithGoogle = async (redirectUrl: string = '/') => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await callCreateSession(result.user, redirectUrl);
  };

  const loginWithApple = async (redirectUrl: string = '/') => {
    const provider = new OAuthProvider('apple.com');
    const result = await signInWithPopup(auth, provider);
    await callCreateSession(result.user, redirectUrl);
  };

  return {
    login,
    register,
    loginWithGoogle,
    loginWithApple,
  };
}
