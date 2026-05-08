import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import SignupTypePage from './pages/auth/SignupTypePage';
import SignupStep2Page from './pages/auth/SignupStep2Page';
import SignupFormPage from './pages/auth/SignupFormPage';
import VerificationPage from './pages/auth/VerificationPage';
import OrgTypeSelectPage from './pages/auth/OrgTypeSelectPage';
import OrgFormPage from './pages/auth/OrgFormPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Signup — individual */}
        <Route path="/signup" element={<SignupTypePage />} />
        <Route path="/signup/step2" element={<SignupStep2Page />} />
        <Route path="/signup/form" element={<SignupFormPage />} />
        <Route path="/signup/verify" element={<VerificationPage />} />

        {/* Signup — organisation */}
        <Route path="/signup/org/select" element={<OrgTypeSelectPage />} />
        <Route path="/signup/org/form" element={<OrgFormPage />} />

        {/* App */}
        <Route path="/home" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
