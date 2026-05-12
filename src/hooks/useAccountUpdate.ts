import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyProfile, saveProfile, type ProfileData } from '../services/accountService';

export interface AccountUpdateState {
  profile: ProfileData | null;
  loading: boolean;
  saving: boolean;
  error: string;
  successMsg: string;
  save: (data: Partial<ProfileData>) => Promise<boolean>;
}

export function useAccountUpdate(): AccountUpdateState {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load profile';
        if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('token') || msg.toLowerCase().includes('unauthorized')) {
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(`Failed to load your profile data: ${msg}`);
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const save = useCallback(async (data: Partial<ProfileData>): Promise<boolean> => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await saveProfile(data);
      setProfile(updated);
      setSuccessMsg('Saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { profile, loading, saving, error, successMsg, save };
}
