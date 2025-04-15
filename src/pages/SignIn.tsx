import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '@/src/components/AuthLayout';
import AuthForm from '@/src/components/AuthForm';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function SignIn() {
  const [redirectUrl, setRedirectUrl] = useState('/');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    const shouldRedirectToCheckout = params.get('redirectToCheckout') === 'true';
    const tier = params.get('tier');
    console.log('🔍 redirect param:', redirectParam);
    console.log('🛒 shouldRedirectToCheckout:', shouldRedirectToCheckout);
    console.log('🏷️ tier:', tier);

    const allowedDomains = [
      'mindwell.io',
      'mel.mindwell.io',
      'mel.ai',
      'mindwellworld.com',
      'auth.mindwellworld.com',
    ];

    try {
      if (redirectParam) {
        const url = new URL(redirectParam);
        if (allowedDomains.includes(url.hostname)) {
          setRedirectUrl(redirectParam);
        } else {
          console.warn('❌ Disallowed redirect domain:', url.hostname);
        }
      }
    } catch (e) {
      console.error('Invalid redirect param:', e);
    }

    // 👇 NEW: Trigger Stripe checkout after login if redirectToCheckout is true
    if (shouldRedirectToCheckout && tier) {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const res = await fetch('/api/startCheckoutSession', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.uid,
                tier,
              }),
            });

            const { checkoutUrl } = await res.json();
            if (checkoutUrl) {
              window.location.href = checkoutUrl;
            } else {
              console.error('❌ No checkout URL returned');
            }
          } catch (err) {
            console.error('❌ Error starting checkout session:', err);
          } finally {
            unsubscribe();
          }
        }
      });
    }
  }, [location.search]);

  return (
    <AuthLayout title="Sign In">
      <AuthForm mode="signin" redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}
