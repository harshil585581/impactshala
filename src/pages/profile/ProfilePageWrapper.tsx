import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import OrgProfilePage from './OrgProfilePage';
import ForProfitOrgProfilePage from './ForProfitOrgProfilePage';
import NonProfitOrgProfilePage from './NonProfitOrgProfilePage';
import HealthServicesOrgProfilePage from './HealthServicesOrgProfilePage';
import PublicUtilitiesOrgProfilePage from './PublicUtilitiesOrgProfilePage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function resolveOrgPage(orgType?: string) {
  if (orgType === 'forprofit') return <ForProfitOrgProfilePage />;
  if (orgType === 'nonprofit') return <NonProfitOrgProfilePage />;
  if (orgType === 'health') return <HealthServicesOrgProfilePage />;
  if (orgType === 'utilities') return <PublicUtilitiesOrgProfilePage />;
  return <OrgProfilePage />;
}

export default function ProfilePageWrapper() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOwnProfile = userId === 'me' || userId === storedUser.id;

  // For own profile: type is known from localStorage, but org_type may not be —
  // so we still need a quick fetch for org users to know which org page to render.
  if (isOwnProfile) {
    if (storedUser.user_type !== 'organization') return <ProfilePage />;
    // org: delegate to router that fetches org_type
    return <OwnOrgRouter />;
  }

  return <OtherProfileRouter userId={userId} />;
}

function OwnOrgRouter() {
  const [orgType, setOrgType] = useState<string | null>(null);
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token = storedUser.access_token ?? '';

  useEffect(() => {
    fetch(`${API_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setOrgType(data.org_type ?? ''))
      .catch(() => setOrgType(''));
  }, []);

  if (orgType === null) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff9400] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return resolveOrgPage(orgType);
}

function OtherProfileRouter({ userId }: { userId: string }) {
  const [info, setInfo] = useState<{ userType: string; orgType: string } | null>(null);
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token = storedUser.access_token ?? '';

  useEffect(() => {
    fetch(`${API_URL}/api/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setInfo({ userType: data.user_type ?? 'individual', orgType: data.org_type ?? '' }))
      .catch(() => setInfo({ userType: 'individual', orgType: '' }));
  }, [userId]);

  if (info === null) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff9400] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (info.userType === 'organization') return resolveOrgPage(info.orgType);
  return <ProfilePage />;
}
