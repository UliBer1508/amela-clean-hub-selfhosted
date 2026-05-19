import React from 'react';
import { CalendarClock, X } from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { useReminderSettings } from '@/hooks/useReminderSettings';

interface NextCleaning {
  date: string;
  time?: string | null;
  houseName?: string;
}

interface Props {
  entries: Array<{ type: 'booking' | 'standalone'; data: any }>;
}

const getNextCleaning = (entries: Props['entries']): NextCleaning | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates: NextCleaning[] = [];
  for (const entry of entries) {
    if (entry.type === 'booking') {
      const tasks = entry.data?.service_tasks || [];
      for (const t of tasks) {
        if (!t.scheduled_date) continue;
        if (t.status === 'completed' || t.status === 'cancelled') continue;
        candidates.push({
          date: t.scheduled_date,
          time: t.scheduled_time,
          houseName: entry.data?.houses?.name,
        });
      }
    } else {
      const t = entry.data;
      if (!t.scheduled_date) continue;
      if (t.status === 'completed' || t.status === 'cancelled') continue;
      candidates.push({
        date: t.scheduled_date,
        time: t.scheduled_time,
        houseName: t.houses?.name,
      });
    }
  }

  const upcoming = candidates
    .filter((c) => {
      const d = parseISO(c.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return upcoming[0] || null;
};

const CleaningReminderBanner: React.FC<Props> = ({ entries }) => {
  const { settings, update } = useReminderSettings();

  if (!settings.enabled) return null;

  const next = getNextCleaning(entries);
  if (!next) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseISO(next.date);
  target.setHours(0, 0, 0, 0);
  const daysUntil = differenceInCalendarDays(target, today);

  if (daysUntil > settings.daysBefore) return null;

  const whenText =
    daysUntil === 0
      ? 'heute'
      : daysUntil === 1
      ? 'morgen'
      : `in ${daysUntil} Tagen`;

  return (
    <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 flex items-start gap-3">
      <div className="w-10 h-10 rounded-md bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
        <CalendarClock className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
          Nächste Reinigung {whenText}
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5">
          {format(target, 'EEEE, dd.MM.yyyy', { locale: de })}
          {next.time ? ` · ${next.time.slice(0, 5)} Uhr` : ''}
          {next.houseName ? ` · ${next.houseName}` : ''}
        </p>
      </div>
      <button
        onClick={() => update({ enabled: false })}
        aria-label="Banner ausblenden"
        className="shrink-0 w-11 h-11 -m-1 flex items-center justify-center rounded-md text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 active:scale-95 transition"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CleaningReminderBanner;
