import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const SignupTypePage = lazy(() => import('./pages/auth/SignupTypePage'));
const SignupStep2Page = lazy(() => import('./pages/auth/SignupStep2Page'));
const SignupFormPage = lazy(() => import('./pages/auth/SignupFormPage'));
const VerificationPage = lazy(() => import('./pages/auth/VerificationPage'));
const OrgTypeSelectPage = lazy(() => import('./pages/auth/OrgTypeSelectPage'));
const OrgFormPage = lazy(() => import('./pages/auth/OrgFormPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const UpdateAccountPage = lazy(() => import('./pages/account/UpdateAccountPage'));
const UpdateOrgAccountPage = lazy(() => import('./pages/account/UpdateOrgAccountPage'));
const ForProfitOrgAccountUpdatePage = lazy(() => import('./pages/account/ForProfitOrgAccountUpdatePage'));

const InternationalOrgAccountUpdatePage = lazy(() => import('./pages/account/InternationalOrgAccountUpdatePage'));

const NonProfitOrgAccountUpdatePage = lazy(() => import('./pages/account/NonProfitOrgAccountUpdatePage'));
const HealthServicesOrgAccountUpdatePage = lazy(() => import('./pages/account/HealthServicesOrgAccountUpdatePage'));

const PublicSafetyLawOrgAccountUpdatePage = lazy(() => import('./pages/account/PublicSafetyLawOrgAccountUpdatePage'));
const TalentShowcaseOrgAccountUpdatePage = lazy(() => import('./pages/account/TalentShowcaseOrgAccountUpdatePage'));
const StartupSupportOrgAccountUpdatePage = lazy(() => import('./pages/account/StartupSupportOrgAccountUpdatePage'));
const FieldTripVenueOrgAccountUpdatePage = lazy(() => import('./pages/account/FieldTripVenueOrgAccountUpdatePage'));

const PublicUtilitiesOrgAccountUpdatePage = lazy(() => import('./pages/account/PublicUtilitiesOrgAccountUpdatePage'));
const PublicWelfareServicesOrgAccountUpdatePage = lazy(() => import('./pages/account/PublicWelfareServicesOrgAccountUpdatePage'));

const StudentAccountUpdatePage = lazy(() => import('./pages/account/StudentAccountUpdatePage'));
const EntrepreneurAccountUpdatePage = lazy(() => import('./pages/account/EntrepreneurAccountUpdatePage'));
const ProfilePageWrapper = lazy(() => import('./pages/profile/ProfilePageWrapper'));
const UserPostsPage = lazy(() => import('./pages/profile/UserPostsPage'));
const ProfessionalAccountUpdatePage = lazy(() => import('./pages/account/ProfessionalAccountUpdatePage'));
const EducatorAccountUpdatePage = lazy(() => import('./pages/account/EducatorAccountUpdatePage'));
const AuthCallbackPage = lazy(() => import('./pages/auth/AuthCallbackPage'));
const MyApplicationsPage = lazy(() => import('./pages/applications/MyApplicationsPage'));
const DiscoverAppliedPage = lazy(() => import('./pages/applications/DiscoverAppliedPage'));
const DiscoverMyPostingsPage = lazy(() => import('./pages/applications/DiscoverMyPostingsPage'));
const ApplicantsDetailPage = lazy(() => import('./pages/applications/ApplicantsDetailPage'));
const MyPostingsPage = lazy(() => import('./pages/applications/MyPostingsPage'));
const LearningDirectoryMyApplicationsPage = lazy(() => import('./pages/applications/LearningDirectoryMyApplicationsPage'));
const DiscoverPage = lazy(() => import('./pages/DiscoverPage'));

const CreateProviderPage = lazy(() => import('./pages/discover/CreateProviderPage'));
const CreateProviderDetailsPage = lazy(() => import('./pages/discover/CreateProviderDetailsPage'));
const CreateProviderPreviewPage = lazy(() => import('./pages/discover/CreateProviderPreviewPage'));
const CreateSeekerPage = lazy(() => import('./pages/discover/CreateSeekerPage'));
const CreateSeekerDetailsPage = lazy(() => import('./pages/discover/CreateSeekerDetailsPage'));
const CreateSeekerPreviewPage = lazy(() => import('./pages/discover/CreateSeekerPreviewPage'));

const LearningDirectoryPage = lazy(() => import('./pages/learning/LearningDirectoryPage'));
const EmploymentHubDiscoveryPage = lazy(() => import('./pages/employment/EmploymentHubDiscoveryPage'));
const EmploymentHubPage = lazy(() => import('./pages/employment/EmploymentHubPage'));
const JobSeekerHubPage = lazy(() => import('./pages/employment/JobSeekerHubPage'));

const ListCoursePage = lazy(() => import('./pages/learning/ListCoursePage'));
const ListCourseStep2Page = lazy(() => import('./pages/learning/ListCourseStep2Page'));
const PreviewCoursePage = lazy(() => import('./pages/learning/PreviewCoursePage'));

const SavedPostsPage = lazy(() => import('./pages/SavedPostsPage'));
const SavedCategoryPage = lazy(() => import('./pages/SavedCategoryPage'));
const MyCommunityPage = lazy(() => import('./pages/MyCommunityPage'));
const ManageCommunityPage = lazy(() => import('./pages/ManageCommunityPage'));
const ManageRequestPage = lazy(() => import('./pages/ManageRequestPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const NotificationsPage = lazy(() => import('./pages/notifications/NotificationsPage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const SettingsForgotPasswordPage = lazy(() => import('./pages/settings/SettingsForgotPasswordPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
      <div className="w-8 h-8 border-2 border-[#FF9400] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
