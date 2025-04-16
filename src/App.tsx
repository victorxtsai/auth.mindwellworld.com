import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from '@/src/pages/SignUp';
import PasswordReset from '@/src/pages/PasswordReset';
import Redirect from '@/src/pages/Redirect';
import Checkout from './pages/Checkout'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/redirect" element={<Redirect />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </BrowserRouter>
  );
}
