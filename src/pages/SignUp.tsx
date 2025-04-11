import { useEffect, useState } from 'react';
import AuthLayout from '@/src/components/AuthLayout';
import AuthForm from '@/src/components/AuthForm';

export default function SignUp() {
  const [redirectUrl, setRedirectUrl] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirectParam = params.get('redirect');
    if (redirectParam) setRedirectUrl(redirectParam);
  }, []);

  return (
    <AuthLayout title="Create An Account">
      <AuthForm mode="signup" redirectUrl={redirectUrl} />
    </AuthLayout>
  );
}
