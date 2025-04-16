import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export default function CheckoutPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tier = params.get('tier');

    if (!tier) {
      setError('Missing subscription tier.');
      setLoading(false);
      return;
    }

    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('You must be signed in to subscribe.');
        setLoading(false);
        return;
      }

      try {
        const idToken = await user.getIdToken();

        const res = await fetch('/api/startCheckoutSession', {
          method: 'POST',
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
          setError('No checkout URL returned.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to start checkout.');
      } finally {
        setLoading(false);
        unsubscribe();
      }
    });

    return () => unsubscribe();
  }, [location.search]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#2F52E0] via-[#000000] to-[#000000] flex items-center justify-center px-6 py-24 sm:py-32 lg:px-8">
        <div className="text-center">
            {loading && <p className="text-base/7 text-[#16F4D0]" style={{ fontFamily: 'DefaultFont' }}>
                Redirecting...
            </p> }
            {error && <p className="mt-4 text-red-400">{error}</p>}
        </div>
    </div>
  );
}
