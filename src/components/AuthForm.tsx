import React, { useState } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';
import { useFirebaseAuth } from '@/src/hooks/useFirebaseAuth';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  mode: 'signin' | 'signup';
  redirectUrl?: string;
  disableSessionRedirect?: boolean; // ✅ Add this
}


export default function AuthForm({ mode, redirectUrl = '/', disableSessionRedirect = false }: AuthFormProps) {
  const { login, register, loginWithGoogle, loginWithApple } = useFirebaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const mapFirebaseError = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      default:
        // return code;  
        return 'Something went wrong. Please try again.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      // Save or remove email for "Remember me"
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
  
      // Call correct auth flow
      if (mode === 'signup') {
        if (!disableSessionRedirect) {
          await register(email, password, redirectUrl);
        } else {
          await register(email, password);
        }
      } else {
        if (!disableSessionRedirect) {
          await login(email, password, rememberMe, redirectUrl);
        } else {
          await login(email, password, rememberMe, undefined);
        }
      }      
  
    } catch (err: any) {
      const friendly = mapFirebaseError(err.code);
      setError(friendly);
    }
  };

  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm/6 font-medium text-white">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm/6 font-medium text-white">
          Password
        </label>
        <div className="relative">
            <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-black"
            >
                {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
                ) : (
                <EyeIcon className="h-5 w-5" />
                )}
            </button>
        </div>
        {/* ✅ Password guidelines */}
        <p className="mt-1 text-xs text-gray-300">
          Password must be at least 8 characters and include an uppercase, lowercase, number, and special character.
        </p>
      </div>

      {/* Remember Me + Forgot Password */}
      {mode === 'signin' && (
        <div className="flex items-center justify-between">
          <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-white">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:text-indigo-500 text-sm">
            Forgot password?
          </Link>
        </div>
      )}

      {/* Error message */}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {/* Submit */}
      <button
        type="submit"
        className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        {mode === 'signup' ? 'Sign Up' : 'Sign In'}
      </button>

      {/* Social Login */}
      <div className="relative mt-10">
        <div aria-hidden="true" className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm/6 font-medium">
            <span className="bg-black px-6 text-white">Or continue with</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
            type="button"
            onClick={() => loginWithGoogle(redirectUrl)}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:ring-transparent"
        >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
                d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.55L20.0303 3.125C17.9503 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.61L5.27028 9.705C6.21525 6.86 8.87028 4.75 12.0003 4.75Z"
                fill="#EA4335"
            />
            <path
                d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                fill="#4285F4"
            />
            <path
                d="M5.265 14.295C5.025 13.57 4.885 12.8 4.885 12C4.885 11.2 5.02 10.43 5.265 9.705L1.275 6.61C0.46 8.23 0 10.06 0 12C0 13.94 0.46 15.77 1.28 17.39L5.265 14.295Z"
                fill="#FBBC05"
            />
            <path
                d="M12.0004 24C15.2404 24 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24 12.0004 24Z"
                fill="#34A853"
            />
            </svg>
            <span>Google</span>
        </button>

        <button
            type="button"
            onClick={() => loginWithApple(redirectUrl)}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus-visible:ring-transparent"
        >
            <svg fill="currentColor" viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5 fill-black">
            <path d="M16.365 13.29c-.27.63-.585 1.165-.945 1.61-.49.615-.89 1.04-1.2 1.28-.48.41-.996.62-1.545.62-.395 0-.87-.115-1.43-.34-.56-.23-1.07-.345-1.53-.345-.48 0-.996.115-1.545.345-.54.225-1.006.34-1.395.34-.57 0-1.1-.22-1.59-.655-.3-.26-.655-.67-1.07-1.235-.445-.61-.82-1.32-1.125-2.125-.33-.88-.495-1.735-.495-2.565 0-.945.2-1.765.6-2.46.41-.73.94-1.28 1.59-1.645.51-.3 1.13-.455 1.86-.47.41 0 .945.13 1.605.39.65.26 1.065.39 1.24.39.13 0 .58-.15 1.35-.45.73-.26 1.345-.365 1.845-.315 1.36.11 2.39.67 3.09 1.68-1.23.75-1.84 1.815-1.83 3.195.01.92.275 1.69.795 2.31zM13.92 5.135c0 .8-.29 1.515-.875 2.145-.7.79-1.535 1.25-2.465 1.175a2.9 2.9 0 0 1-.03-.34c0-.755.33-1.57.92-2.27.29-.34.665-.63 1.12-.86.45-.225.88-.34 1.29-.34h.04c.01.16.01.31 0 .49z" />
            </svg>
            <span>Apple</span>
        </button>
    </div>


      {/* Switch between login/signup */}
      <div className="text-center text-sm text-white mt-6">
        {mode === 'signin' ? (
          <>
            Don’t have an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:underline">
              Sign Up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/" className="text-indigo-400 hover:underline">
              Sign In
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
