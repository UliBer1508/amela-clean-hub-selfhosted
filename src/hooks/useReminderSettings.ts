import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'amela_reminder_settings_v1';

export interface ReminderSettings {
  enabled: boolean;
  daysBefore: number;
}

const DEFAULTS: ReminderSettings = {
  enabled: true,
  daysBefore: 2,
};

const read = (): ReminderSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULTS.enabled,
      daysBefore: Number.isFinite(parsed.daysBefore) ? parsed.daysBefore : DEFAULTS.daysBefore,
    };
  } catch {
    return DEFAULTS;
  }
};

export const useReminderSettings = () => {
  const [settings, setSettings] = useState<ReminderSettings>(read);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(read());
    };
    const local = () => setSettings(read());
    window.addEventListener('storage', handler);
    window.addEventListener('amela:reminder-settings-changed', local);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('amela:reminder-settings-changed', local);
    };
  }, []);

  const update = useCallback((next: Partial<ReminderSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event('amela:reminder-settings-changed'));
      return merged;
    });
  }, []);

  return { settings, update };
};
