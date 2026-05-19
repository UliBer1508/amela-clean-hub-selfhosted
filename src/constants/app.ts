export const AMELA_PROVIDER_ID =
  (import.meta.env.VITE_AMELA_PROVIDER_ID as string | undefined) ??
  '9de6e071-7e89-4d66-9433-a5f01acaa493';

export const APP_CONFIG = {
  ITEMS_PER_PAGE: 50,
  SEARCH_DEBOUNCE_MS: 300,
  DEFAULT_TIME: '09:00',
  LOADING_TIMEOUT: 30000,
} as const;

export const TIME_FILTERS = {
  all: 'Alle Zeiten',
  week: 'n. Woche', 
  month: 'n. Monat',
  '3months': 'n. 3 Monate',
} as const;

export const STATUS_FILTERS = {
  all: 'Alle Status',
  scheduled: 'Geplant',
  completed: 'Abgeschlossen',
  cancelled: 'Storniert',
  in_progress: 'In Bearbeitung',
  delayed: 'Verzögert',
} as const;

export const STAFF_FILTERS = {
  all: 'Alle Putzkräfte',
  amela: 'Amela',
  tatort: 'Tatort Reiniger',
} as const;

export const NOTIFICATION_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated', 
  TASK_COMPLETED: 'task_completed',
  TASK_CANCELLED: 'task_cancelled',
} as const;