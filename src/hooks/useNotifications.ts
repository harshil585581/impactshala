import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  dismissAllNotifications,
  type AppNotification,
} from '../services/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = JSON.parse(localStorage.getItem('user') ?? '{}').id ?? '';
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch { /* silently ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription — listen for new notifications inserted for this user
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as AppNotification, ...prev]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    await markAllNotificationsRead();
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await dismissNotification(id);
  }, []);

  const dismissAll = useCallback(async () => {
    setNotifications([]);
    await dismissAllNotifications();
  }, []);

  return { notifications, loading, unreadCount, markRead, markAllRead, dismiss, dismissAll, reload: load };
}
