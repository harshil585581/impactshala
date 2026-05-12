import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, EditProfileForm, Toast } from '../types/profile';
import { fetchProfile, updateProfile, toggleFollow } from '../services/profileService';

export function useProfile(userId: string) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: Toast['type'], message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProfile(userId)
      .then(setProfile)
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('401')) {
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          addToast('error', 'Failed to load profile');
        }
      })
      .finally(() => setLoading(false));
  }, [userId, addToast]);

  const saveProfile = useCallback(async (data: Partial<EditProfileForm>) => {
    setSaving(true);
    try {
      await updateProfile(data);
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...data,
              firstName: data.firstName ?? prev.firstName,
              lastName: data.lastName ?? prev.lastName,
            }
          : prev
      );
      addToast('success', 'Profile updated successfully!');
    } catch {
      addToast('error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [addToast]);

  const follow = useCallback(async () => {
    if (!profile) return;
    const next = !profile.isFollowing;
    setProfile((prev) => prev ? { ...prev, isFollowing: next } : prev);
    try {
      await toggleFollow(profile.id, next);
    } catch {
      setProfile((prev) => prev ? { ...prev, isFollowing: !next } : prev);
      addToast('error', 'Action failed. Please try again.');
    }
  }, [profile, addToast]);

  return { profile, loading, saving, toasts, removeToast, saveProfile, follow };
}
