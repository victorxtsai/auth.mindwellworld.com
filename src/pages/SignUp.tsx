import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '@/src/components/AuthLayout';
import AuthForm from '@/src/components/AuthForm';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function SignUp() {
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

    // ✅ Accept all redirects now
    if (redirectParam) {
      setRedirectUrl(redirectParam);
    }

    // 👇 Stripe checkout after signup
    if (shouldRedirectToCheckout && tier) {
      const auth = getAuth();

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const idToken = await user.getIdToken();

            const res = await fetch('/api/startCheckoutSession', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ tier }),
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
            unsubscribe(); // ✅ Clean up
          }
        }
      });

      return () => unsubscribe(); // clean up on unmount
    }
  }, [location.search]);


  return (
    <AuthLayout title="Create An Account">
      <AuthForm mode="signup" redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}
