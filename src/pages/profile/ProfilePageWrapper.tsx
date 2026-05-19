import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProfilePage from './ProfilePage';
import OrgProfilePage from './OrgProfilePage';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function ProfilePageWrapper() {
  const { userId = 'me' } = useParams<{ userId?: string }>();
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const isOwnProfile = userId === 'me' || userId === storedUser.id;

  // For own profile we know the type immediately from localStorage
  if (isOwnProfile) {
    return storedUser.user_type === 'organization'
      ? <OrgProfilePage />
      : <ProfilePage />;
  }

  // For other users' profiles, fetch their type first
  return <OtherProfileRouter userId={userId} />;
}

function OtherProfileRouter({ userId }: { userId: string }) {
  const [userType, setUserType] = useState<string | null>(null);
  const storedUser = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token = storedUser.access_token ?? '';

  useEffect(() => {
    fetch(`${API_URL}/api/profile/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUserType(data.user_type ?? 'individual'))
      .catch(() => setUserType('individual'));
  }, [userId]);

  if (userType === null) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff9400] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return userType === 'organization' ? <OrgProfilePage /> : <ProfilePage />;
}
