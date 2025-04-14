import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Redirect() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') ?? 'https://mindwell.io';

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirect;
    }, 250); // allow cookie to be set

    return () => clearTimeout(timer);
  }, [redirect]);

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#2F52E0] via-[#000000] to-[#000000] flex items-center justify-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base/7 text-[#16F4D0]" style={{ fontFamily: 'DefaultFont' }}>
          Redirecting...
        </p>
      </div>
    </div>
  );
}
