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
import UpdateAccountPage from './pages/account/UpdateAccountPage';
import StudentAccountUpdatePage from './pages/account/StudentAccountUpdatePage';
import EntrepreneurAccountUpdatePage from './pages/account/EntrepreneurAccountUpdatePage';
import ProfilePage from './pages/profile/ProfilePage';
import ProfessionalAccountUpdatePage from './pages/account/ProfessionalAccountUpdatePage';
import EducatorAccountUpdatePage from './pages/account/EducatorAccountUpdatePage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import MyApplicationsPage from './pages/applications/MyApplicationsPage';
import ApplicantsDetailPage from './pages/applications/ApplicantsDetailPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
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

        {/* Profile */}
        <Route path="/profile/me" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />

        {/* App */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/applications" element={<MyApplicationsPage />} />
        <Route path="/applications/detail/:postingId" element={<ApplicantsDetailPage />} />
        <Route path="/account/update" element={<UpdateAccountPage />} />
        <Route path="/account/update/student" element={<StudentAccountUpdatePage />} />
        <Route path="/account/update/entrepreneur" element={<EntrepreneurAccountUpdatePage />} />
        <Route path="/account/update/professional" element={<ProfessionalAccountUpdatePage />} />
        <Route path="/account/update/educator" element={<EducatorAccountUpdatePage />} />
      </Routes>
    </BrowserRouter>
  );
}
