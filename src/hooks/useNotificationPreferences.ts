import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { NotificationPreferences } from '@/types/notifications';

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('boris_notification_preferences')
        .select('*')
        .eq('user_name', 'Amela')
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setPreferences(data);
      } else {
        // Default preferences if none exist
        setPreferences({
          id: '',
          user_name: 'Amela',
          toast_notifications: true,
          email_notifications: false,
          push_notifications: false,
          sound_notifications: false,
          notify_new_tasks: true,
          notify_task_changes: true,
          notify_status_updates: true,
          notify_urgent_tasks: true,
          email_address: null,
        });
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
      // Set default preferences on error
      setPreferences({
        id: '',
        user_name: 'Amela',
        toast_notifications: true,
        email_notifications: false,
        push_notifications: false,
        sound_notifications: false,
        notify_new_tasks: true,
        notify_task_changes: true,
        notify_status_updates: true,
        notify_urgent_tasks: true,
        email_address: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`notification_preferences_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boris_notification_preferences',
          filter: `user_name=eq.Amela`,
        },
        () => {
          fetchPreferences();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    error,
    refetch: fetchPreferences,
  };
}
