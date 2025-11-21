import type { ToastActionElement } from '@/components/ui/toast';

export type NotificationEventType = 
  | 'new_task'
  | 'task_change'
  | 'status_update'
  | 'urgent_task'
  | 'staff_change'
  | 'system'
  | 'info';

export interface NotificationPreferences {
  id: string;
  user_name: string;
  toast_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  sound_notifications: boolean;
  notify_new_tasks: boolean;
  notify_task_changes: boolean;
  notify_status_updates: boolean;
  notify_urgent_tasks: boolean;
  email_address: string | null;
}

export interface NotifyOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  eventType?: NotificationEventType;
  action?: ToastActionElement;
  duration?: number;
}
