import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthenticatedSession } from '../lib/supabase';

export function useRequireAuth() {
  const navigate = useNavigate();
  useEffect(() => {
    getAuthenticatedSession().then((session) => {
      if (!session) navigate('/login', { replace: true });
    });
  }, [navigate]);
}
