import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '@/src/components/AuthLayout';
import AuthForm from '@/src/components/AuthForm';

export default function SignUp() {
  const [redirectUrl, setRedirectUrl] = useState('/');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    console.log('🔍 redirect param:', redirectParam);
    const allowedDomains = ['mindwell.io', 'mel.mindwell.io', 'mel.ai', 'mindwellworld.com', 'auth.mindwellworld.com'];
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
  }, [location.search]);

  return (
    <AuthLayout title="Create An Account">
      <AuthForm mode="signup" redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}
