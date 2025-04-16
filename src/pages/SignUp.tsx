import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '@/src/components/AuthLayout';
import AuthForm from '@/src/components/AuthForm';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function SignUp() {
  const [redirectUrl, setRedirectUrl] = useState('/');
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState(false);
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirectParam = params.get('redirect');
  const shouldRedirectToCheckout = params.get('redirectToCheckout') === 'true';
  const tier = params.get('tier');

  useEffect(() => {
    console.log('🔍 redirect param:', redirectParam);
    console.log('🛒 shouldRedirectToCheckout:', shouldRedirectToCheckout);
    console.log('🏷️ tier:', tier);
    if (redirectParam) {
      setRedirectUrl(redirectParam);
    }

    if (shouldRedirectToCheckout && tier && !hasAttemptedCheckout) {
      const auth = getAuth();

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setHasAttemptedCheckout(true);

          try {
            const idToken = await user.getIdToken();

            const res = await fetch('/api/startStripeCheckoutSession', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({ tier }),
            });

            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(errorText);
            }

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

      return () => unsubscribe();
    }
  }, [location.search, hasAttemptedCheckout]);

  return (
    <AuthLayout title="Create An Account">
      <AuthForm
        mode="signup"
        redirectUrl={redirectUrl}
        disableSessionRedirect={shouldRedirectToCheckout} // ✅ Add this line
      />
    </AuthLayout>
  );
}
