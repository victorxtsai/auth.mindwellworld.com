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
      const isMobileDeepLink = redirectUrl.startsWith('mindwellapp://');

      if (!isMobileDeepLink) {
        // ✅ Redirect back to original redirect URL
        const encodedRedirect = encodeURIComponent(redirectUrl);
        window.location.href = `https://${fallbackDomain}/redirect?token=${idToken}&redirect=${encodedRedirect}`;
        return;
      }
    }

    // 🚨 If no redirect or it's a mobile deep link, try mobile app
    window.location.href = mobileAppURL;

    // 🛑 Fallback if mobile deep link doesn't open
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
