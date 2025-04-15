import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  sendEmailVerification,
  User,
  setPersistence, browserLocalPersistence, browserSessionPersistence
} from 'firebase/auth';
import { auth } from '@/src/firebaseConfig';


const callCreateSession = async (user: User, redirectUrl: string = '/') => {
  const idToken = await user.getIdToken();

  // Extract domain from redirectUrl (or default to mindwell.io)
  const url = new URL(redirectUrl, 'https://mindwell.io'); // Fallback ensures URL object is valid
  let domain = url.hostname;

  // Optional: Lock allowed domains (to avoid misuse)
  const allowedDomains = ['mindwell.io', 'mel.mindwell.io', 'mel.ai', 'mindwellworld.com', 'auth.mindwellworld.com'];
  if (!allowedDomains.includes(domain)) {
    domain = 'mindwell.io';
  }

  // Handle mobile deep linking
  const isMobile = redirectUrl.startsWith('mindwellapp://');
  const sessionURL = isMobile
    ? `mindwellapp://setSession?token=${idToken}`
    : `https://${domain}/api/setSession?token=${idToken}&redirect=${encodeURIComponent(redirectUrl)}`;

  // Go to domain to set the cookie
  window.location.href = sessionURL;
};



export function useFirebaseAuth() {
  const login = async (email: string, password: string, redirectUrl: string = '/', rememberMe: boolean) => {
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
