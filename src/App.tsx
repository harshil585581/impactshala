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
import UpdateOrgAccountPage from './pages/account/UpdateOrgAccountPage';
import ForProfitOrgAccountUpdatePage from './pages/account/ForProfitOrgAccountUpdatePage';

import InternationalOrgAccountUpdatePage from './pages/account/InternationalOrgAccountUpdatePage';

import NonProfitOrgAccountUpdatePage from './pages/account/NonProfitOrgAccountUpdatePage';
import HealthServicesOrgAccountUpdatePage from './pages/account/HealthServicesOrgAccountUpdatePage';

import PublicSafetyLawOrgAccountUpdatePage from './pages/account/PublicSafetyLawOrgAccountUpdatePage';
import TalentShowcaseOrgAccountUpdatePage from './pages/account/TalentShowcaseOrgAccountUpdatePage';
import StartupSupportOrgAccountUpdatePage from './pages/account/StartupSupportOrgAccountUpdatePage';
import FieldTripVenueOrgAccountUpdatePage from './pages/account/FieldTripVenueOrgAccountUpdatePage';

import PublicUtilitiesOrgAccountUpdatePage from './pages/account/PublicUtilitiesOrgAccountUpdatePage';
import PublicWelfareServicesOrgAccountUpdatePage from './pages/account/PublicWelfareServicesOrgAccountUpdatePage';

import StudentAccountUpdatePage from './pages/account/StudentAccountUpdatePage';
import EntrepreneurAccountUpdatePage from './pages/account/EntrepreneurAccountUpdatePage';
import ProfilePageWrapper from './pages/profile/ProfilePageWrapper';
import UserPostsPage from './pages/profile/UserPostsPage';
import ProfessionalAccountUpdatePage from './pages/account/ProfessionalAccountUpdatePage';
import EducatorAccountUpdatePage from './pages/account/EducatorAccountUpdatePage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import MyApplicationsPage from './pages/applications/MyApplicationsPage';
import DiscoverAppliedPage from './pages/applications/DiscoverAppliedPage';
import DiscoverMyPostingsPage from './pages/applications/DiscoverMyPostingsPage';
import ApplicantsDetailPage from './pages/applications/ApplicantsDetailPage';
import MyPostingsPage from './pages/applications/MyPostingsPage';
import LearningDirectoryMyApplicationsPage from './pages/applications/LearningDirectoryMyApplicationsPage';
import DiscoverPage from './pages/DiscoverPage';

import CreateProviderPage from './pages/discover/CreateProviderPage';
import CreateProviderDetailsPage from './pages/discover/CreateProviderDetailsPage';
import CreateProviderPreviewPage from './pages/discover/CreateProviderPreviewPage';
import CreateSeekerPage from './pages/discover/CreateSeekerPage';
import CreateSeekerDetailsPage from './pages/discover/CreateSeekerDetailsPage';
import CreateSeekerPreviewPage from './pages/discover/CreateSeekerPreviewPage';

import LearningDirectoryPage from './pages/learning/LearningDirectoryPage';
import EmploymentHubDiscoveryPage from './pages/employment/EmploymentHubDiscoveryPage';
import EmploymentHubPage from './pages/employment/EmploymentHubPage';
import JobSeekerHubPage from './pages/employment/JobSeekerHubPage';

import ListCoursePage from './pages/learning/ListCoursePage';
import ListCourseStep2Page from './pages/learning/ListCourseStep2Page';
import PreviewCoursePage from './pages/learning/PreviewCoursePage';

import SavedPostsPage from './pages/SavedPostsPage';
import SavedCategoryPage from './pages/SavedCategoryPage';
import MyCommunityPage from './pages/MyCommunityPage';
import ManageCommunityPage from './pages/ManageCommunityPage';
import ManageRequestPage from './pages/ManageRequestPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SettingsPage from './pages/settings/SettingsPage';
import SettingsForgotPasswordPage from './pages/settings/SettingsForgotPasswordPage';
import AdminPage from './pages/admin/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
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
        <Route path="/profile/me" element={<ProfilePageWrapper />} />
        <Route path="/profile/me/posts" element={<UserPostsPage />} />
        <Route path="/profile/:userId/posts" element={<UserPostsPage />} />
        <Route path="/profile/:userId" element={<ProfilePageWrapper />} />

        {/* App */}
        <Route path="/home" element={<HomePage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/discover/create/provider" element={<CreateProviderPage />} />
        <Route path="/discover/create/provider/details" element={<CreateProviderDetailsPage />} />
        <Route path="/discover/create/provider/preview" element={<CreateProviderPreviewPage />} />
        <Route path="/discover/create/seeker" element={<CreateSeekerPage />} />
        <Route path="/discover/create/seeker/details" element={<CreateSeekerDetailsPage />} />
        <Route path="/discover/create/seeker/preview" element={<CreateSeekerPreviewPage />} />
        <Route path="/applications" element={<DiscoverAppliedPage />} />
        <Route path="/applications/postings" element={<DiscoverMyPostingsPage />} />
        <Route path="/applications/my-applications" element={<MyApplicationsPage />} />
        <Route path="/applications/my-postings" element={<MyPostingsPage />} />
        <Route path="/applications/detail/:postingId" element={<ApplicantsDetailPage />} />
        <Route path="/applications/learning-directory" element={<LearningDirectoryMyApplicationsPage />} />
        <Route path="/employment-hub" element={<EmploymentHubDiscoveryPage />} />
        <Route path="/employment-hub/employer" element={<EmploymentHubPage />} />
        <Route path="/employment-hub/seeker" element={<JobSeekerHubPage />} />
        <Route path="/learning-directory" element={<LearningDirectoryPage />} />
        <Route path="/learning-directory/list-course" element={<ListCoursePage />} />
        <Route path="/learning-directory/list-course/step2" element={<ListCourseStep2Page />} />
        <Route path="/learning-directory/list-course/preview" element={<PreviewCoursePage />} />
        <Route path="/account/update" element={<UpdateAccountPage />} />
        <Route path="/account/update/org" element={<UpdateOrgAccountPage />} />
        <Route path="/account/update/org/forprofit" element={<ForProfitOrgAccountUpdatePage />} />

        <Route path="/account/update/org/international" element={<InternationalOrgAccountUpdatePage />} />

        <Route path="/account/update/org/nonprofit" element={<NonProfitOrgAccountUpdatePage />} />
        <Route path="/account/update/org/health" element={<HealthServicesOrgAccountUpdatePage />} />

        <Route path="/account/update/org/safety" element={<PublicSafetyLawOrgAccountUpdatePage />} />
        <Route path="/account/update/org/talent" element={<TalentShowcaseOrgAccountUpdatePage />} />
        <Route path="/account/update/org/startup" element={<StartupSupportOrgAccountUpdatePage />} />
        <Route path="/account/update/org/fieldtrip" element={<FieldTripVenueOrgAccountUpdatePage />} />

        <Route path="/account/update/org/utilities" element={<PublicUtilitiesOrgAccountUpdatePage />} />
        <Route path="/account/update/org/welfare" element={<PublicWelfareServicesOrgAccountUpdatePage />} />

        <Route path="/account/update/student" element={<StudentAccountUpdatePage />} />
        <Route path="/account/update/entrepreneur" element={<EntrepreneurAccountUpdatePage />} />
        <Route path="/account/update/professional" element={<ProfessionalAccountUpdatePage />} />
        <Route path="/account/update/educator" element={<EducatorAccountUpdatePage />} />

        {/* Saved Posts */}
        <Route path="/saved" element={<SavedPostsPage />} />
        <Route path="/saved/:category" element={<SavedCategoryPage />} />

        {/* Community */}
        <Route path="/community" element={<MyCommunityPage />} />
        <Route path="/community/manage" element={<ManageCommunityPage />} />
        <Route path="/community/requests" element={<ManageRequestPage />} />

        {/* Search */}
        <Route path="/search" element={<SearchResultsPage />} />

        {/* Messages */}
        <Route path="/messages" element={<MessagesPage />} />

        {/* Notifications */}
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Settings */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/forgot-password" element={<SettingsForgotPasswordPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
