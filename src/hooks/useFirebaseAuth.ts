import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { auth } from '@/src/firebaseConfig';


const callCreateSession = async (user: User, redirectUrl: string = '/') => {
  const idToken = await user.getIdToken();

  const firebaseFunctionURL = `https://us-central1-mindwell-world.cloudfunctions.net/setSession`;
  const mobileDeepLink = `mindwellapp://setSession?token=${idToken}`;

  const isValidRedirect =
    redirectUrl &&
    redirectUrl.startsWith('http') &&
    (redirectUrl.includes('mindwell.io') || redirectUrl.includes('mindwellworld.com'));

  const fallbackRedirect = isValidRedirect ? redirectUrl : 'https://www.mindwell.io';

  const deepLinkURL = isValidRedirect
    ? `${firebaseFunctionURL}?token=${idToken}&redirect=${encodeURIComponent(redirectUrl)}`
    : mobileDeepLink;

  // Try mobile deep link or web version of setSession
  window.location.href = deepLinkURL;

  // ⏳ Fallback to web after 1s if mobile doesn't handle it
  setTimeout(() => {
    window.location.href = `${firebaseFunctionURL}?token=${idToken}&redirect=${encodeURIComponent(fallbackRedirect)}`;
  }, 1000);
};


export function useFirebaseAuth() {
  const login = async (email: string, password: string, redirectUrl: string = '/') => {
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
