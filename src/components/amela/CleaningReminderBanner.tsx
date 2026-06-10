import React, { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useReminderSettings } from '@/hooks/useReminderSettings';

interface NextReminder {
  checkInDate: string;
  houseName?: string;
}

interface Props {
  entries: Array<{ type: 'booking' | 'standalone'; data: any }>;
}

const getNextReminder = (entries: Props['entries']): NextReminder | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const candidates: NextReminder[] = [];
  for (const entry of entries) {
    if (entry.type !== 'booking') continue;
    const b = entry.data;
    if (!b?.check_in) continue;
    const tasks = b.service_tasks || [];
    const hasOpen = tasks.some(
      (t: any) => t && t.status !== 'completed' && t.status !== 'cancelled'
    );
    if (!hasOpen) continue;
    candidates.push({
      checkInDate: b.check_in,
      houseName: b.houses?.name,
    });
  }

  const upcoming = candidates
    .filter((c) => {
      const d = parseISO(c.checkInDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= today.getTime();
    })
    .sort((a, b) => a.checkInDate.localeCompare(b.checkInDate));

  return upcoming[0] || null;
};

const DISMISS_KEY = 'amela:reminder-popup-dismissed';

const CleaningReminderBanner: React.FC<Props> = ({ entries }) => {
  const { settings } = useReminderSettings();
  const [open, setOpen] = useState(false);

  const force =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('reminder') === 'force';

  const next = settings.enabled || force ? getNextReminder(entries) : null;

  let daysUntil: number | null = null;
  let target: Date | null = null;
  if (next) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target = parseISO(next.checkInDate);
    target.setHours(0, 0, 0, 0);
    daysUntil = differenceInCalendarDays(target, today);
  }

  const shouldShow =
    !!next &&
    daysUntil !== null &&
    (force || (settings.enabled && daysUntil <= settings.daysBefore));

  useEffect(() => {
    if (!shouldShow || !next) return;
    const todayKey = new Date().toISOString().slice(0, 10);
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!force && dismissed === `${todayKey}:${next.checkInDate}`) return;
    setOpen(true);
  }, [shouldShow, next?.checkInDate, force]);

  const handleClose = () => {
    setOpen(false);
    if (next && !force) {
      const todayKey = new Date().toISOString().slice(0, 10);
      sessionStorage.setItem(DISMISS_KEY, `${todayKey}:${next.checkInDate}`);
    }
  };

  if (!shouldShow || !next || !target || daysUntil === null) return null;

  const houseName = next.houseName ?? 'Unbekannt';
  const dateText = format(target, 'dd.MM.yyyy', { locale: de });

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-status-delayed" />
            Reinigungs-Erinnerung
          </DialogTitle>
          <DialogDescription className="text-base text-foreground pt-2 leading-relaxed">
            Hallo Amela, es steht eine Buchung für{' '}
            <span className="font-semibold">„{houseName}"</span> für den{' '}
            <span className="font-semibold">{dateText}</span> an. Bitte Reinigung nicht vergessen.
            Vielen Dank.
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
