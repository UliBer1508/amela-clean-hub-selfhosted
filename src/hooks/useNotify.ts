import { useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPreferences } from './useNotificationPreferences';
import type { NotifyOptions, NotificationEventType } from '@/types/notifications';

export function useNotify() {
  const { toast } = useToast();
  const { preferences } = useNotificationPreferences();

  const shouldShowNotification = useCallback(
    (eventType?: NotificationEventType): boolean => {
      // System notifications always show
      if (eventType === 'system') {
        return true;
      }

      // If preferences not loaded yet or toast_notifications is off, don't show (except system)
      if (!preferences || !preferences.toast_notifications) {
        return false;
      }

      // Check event-specific preferences
      switch (eventType) {
        case 'new_task':
          return preferences.notify_new_tasks;
        case 'task_change':
          return preferences.notify_task_changes;
        case 'status_update':
          return preferences.notify_status_updates;
        case 'urgent_task':
          return preferences.notify_urgent_tasks;
        case 'staff_change':
          return preferences.notify_task_changes; // Staff changes are part of task changes
        case 'info':
          return true; // Info notifications respect only toast_notifications (already checked)
        default:
          return true; // Default to showing if no eventType specified
      }
    },
    [preferences]
  );

  const notify = useCallback(
    (options: NotifyOptions) => {
      const { eventType, ...toastOptions } = options;

      if (shouldShowNotification(eventType)) {
        toast(toastOptions);
      }
    },
    [toast, shouldShowNotification]
  );

  return useMemo(
    () => ({
      notify,
      preferences,
    }),
    [notify, preferences]
  );
}
