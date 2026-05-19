import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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

const DISMISS_KEY = 'amela:reminder-popup-dismissed';

const CleaningReminderBanner: React.FC<Props> = ({ entries }) => {
  const { settings } = useReminderSettings();
  const [open, setOpen] = useState(false);

  const next = settings.enabled ? getNextCleaning(entries) : null;

  let daysUntil: number | null = null;
  let target: Date | null = null;
  if (next) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target = parseISO(next.date);
    target.setHours(0, 0, 0, 0);
    daysUntil = differenceInCalendarDays(target, today);
  }

  const shouldShow =
    settings.enabled && next && daysUntil !== null && daysUntil <= settings.daysBefore;

  useEffect(() => {
    if (!shouldShow || !next) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (dismissed === `${todayKey}:${next.date}`) return;
    setOpen(true);
  }, [shouldShow, next?.date]);

  const handleClose = () => {
    setOpen(false);
    if (next) {
      const todayKey = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem(DISMISS_KEY, `${todayKey}:${next.date}`);
    }
  };

  if (!shouldShow || !next || !target || daysUntil === null) return null;

  const whenText =
    daysUntil === 0 ? 'heute' : daysUntil === 1 ? 'morgen' : `in ${daysUntil} Tagen`;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-600" />
            Nächste Reinigung {whenText}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground pt-2">
            {format(target, 'EEEE, dd.MM.yyyy', { locale: de })}
            {next.time ? ` · ${next.time.slice(0, 5)} Uhr` : ''}
            {next.houseName ? (
              <>
                <br />
                <span className="font-medium">{next.houseName}</span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose} className="w-full min-h-11">
            Verstanden
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CleaningReminderBanner;
