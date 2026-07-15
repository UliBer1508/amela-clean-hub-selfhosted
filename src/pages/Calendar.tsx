import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Home, Calendar as CalendarIcon, Bell, MessageCircle, Sparkles } from 'lucide-react';
import Footer, { CopyrightLine } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useAllBookings } from '@/hooks/useAllBookings';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAStatusBar from '@/components/PWAStatusBar';
import { usePWA } from '@/hooks/usePWA';
import ReminderSettingsPopover from '@/components/amela/ReminderSettingsPopover';
import PullToRefresh from '@/components/PullToRefresh';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChatButton } from '@/components/PortalChat';
import { usePortalMessages } from '@/hooks/usePortalMessages';
import { cn } from '@/lib/utils';
import { getGuestName } from '@/lib/guestHelpers';

type ViewType = 'week' | 'month';

// Statuswerte, die eine Reinigung als "nicht mehr aktiv" markieren -> ausblenden.
const CANCELLED_STATUSES = new Set(['cancelled', 'storniert', 'abgebrochen']);

// Haus-Farben für visuelle Unterscheidung
const HOUSE_COLORS = [
  { hex: '#3b82f6' }, { hex: '#a855f7' }, { hex: '#10b981' }, { hex: '#f59e0b' },
  { hex: '#f43f5e' }, { hex: '#06b6d4' }, { hex: '#6366f1' }, { hex: '#ec4899' },
];

// Feste, sprechende Farben je nach Hausname (überschreibt Hash-Farbe)
const HOUSE_NAME_COLOR_OVERRIDES: Array<{ match: string; hex: string }> = [
  { match: 'wald', hex: '#22c55e' },
  { match: 'venediger', hex: '#a855f7' },
];

const getHouseColor = (houseId: string, houseName?: string) => {
  if (houseName) {
    const lower = houseName.toLowerCase();
    const override = HOUSE_NAME_COLOR_OVERRIDES.find(o => lower.includes(o.match));
    if (override) return override.hex;
  }
  if (!houseId) return HOUSE_COLORS[0].hex;
  const hash = houseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return HOUSE_COLORS[hash % HOUSE_COLORS.length].hex;
};

interface CleaningEvent {
  id: string;
  taskId: string;
  date: Date;
  house: string;
  house_id: string;
  status?: string;
  scheduledTime?: string | null;
  notes?: string | null;
  assignedStaffId?: string | null;
  houseAddress?: string | null;
  guestName?: string;
}

interface CalendarProps {
  chatProps: {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
  };
}

const statusLabel = (status?: string) => {
  switch (status) {
    case 'scheduled': return 'Geplant';
    case 'in_progress': return 'In Arbeit';
    case 'completed': return 'Erledigt';
    case 'delayed': return 'Verzögert';
    case 'cancelled': return 'Abgebrochen';
    default: return status || '—';
  }
};

const Calendar = ({ chatProps }: CalendarProps) => {
  const { unreadCount } = usePortalMessages();
  const { isInstalled, isOnline } = usePWA();
  const pwaBarVisible = isInstalled || !isOnline;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('week');
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const { allBookings, loading, forceRefresh } = useAllBookings();
  const { totalCleaningTasks } = useBookings();
  const { houses } = useHouses();
  const { staff: cleaningStaff } = useCleaningStaff();

  // Nur Reinigungen aus den Buchungen ziehen; stornierte Buchungen und
  // stornierte Reinigungen werden ausgefiltert (verhindert Doppel-/Geistereinträge).
  const cleaningEvents = useMemo<CleaningEvent[]>(() => {
    if (!allBookings) return [];
    const events: CleaningEvent[] = [];
    allBookings.forEach(booking => {
      if (booking.status === 'cancelled') return;
      const guestName = getGuestName(booking);
      booking.service_tasks?.forEach(task => {
        if (task.service_type !== 'cleaning') return;
        if (CANCELLED_STATUSES.has(String(task.status || '').toLowerCase())) return;
        if (!task.scheduled_date) return;
        events.push({
          id: `cleaning-${task.id}`,
          taskId: task.id,
          date: new Date(task.scheduled_date),
          house: booking.houses?.name || 'Unbekannt',
          house_id: booking.house_id,
          status: task.status,
          scheduledTime: task.scheduled_time ?? null,
          notes: task.notes ?? null,
          assignedStaffId: task.assigned_staff_id ?? null,
          houseAddress: booking.houses?.address ?? null,
          guestName,
        });
      });
    });
    return events;
  }, [allBookings]);

  const eventsForDay = (day: Date) =>
    cleaningEvents
      .filter(e => isSameDay(e.date, day))
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));

  // Woche: 7 Tage der aktuellen Woche
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Vorschau: die nächsten 4 Wochen nach der aktuellen Woche, jeweils zusammengefasst
  const upcomingWeeks = useMemo(() => {
    const result: Array<{ start: Date; end: Date; events: CleaningEvent[] }> = [];
    for (let i = 1; i <= 4; i++) {
      const start = startOfWeek(addWeeks(currentDate, i), { weekStartsOn: 1 });
      const end = endOfWeek(addWeeks(currentDate, i), { weekStartsOn: 1 });
      const events = cleaningEvents
        .filter(e => isWithinInterval(e.date, { start, end }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      if (events.length > 0) result.push({ start, end, events });
    }
    return result;
  }, [cleaningEvents, currentDate]);

  // Monat: volles Kalendergitter (Mo–So)
  const monthGridDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentDate]);

  const goToToday = () => setCurrentDate(new Date());
  const previousPeriod = () =>
    setCurrentDate(prev => (viewType === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)));
  const nextPeriod = () =>
    setCurrentDate(prev => (viewType === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)));

  const periodTitle =
    viewType === 'week'
      ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`
      : format(currentDate, 'MMMM yyyy', { locale: de });

  const weekdayHeader = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const openDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailOpen(true);
  };

  const handleRefresh = async () => { await forceRefresh(); };

  const selectedEvent = selectedTaskId
    ? cleaningEvents.find(e => e.taskId === selectedTaskId)
    : null;
  const selectedStaff = selectedEvent?.assignedStaffId
    ? cleaningStaff.find(s => s.id === selectedEvent.assignedStaffId)
    : null;

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
    <div className="min-h-screen bg-background">
      <PWAStatusBar />
      <div className={`${pwaBarVisible ? 'pt-12' : 'pt-0'} md:pt-0`}>

      {/* Header (Desktop) */}
      <header className="hidden sm:block bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-foreground">Amela Reinigungsportal</h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="hidden sm:block">
                <ChatButton onClick={() => chatProps.setIsChatOpen(true)} unreadCount={unreadCount} />
              </div>
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden sm:block bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="flex space-x-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="my-2 hover-scale min-h-[44px]">
                <Home className="w-4 h-4 mr-2" />
                Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Button variant="default" size="sm" className="my-2 min-h-[44px]">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Kalender
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="my-2 hover-scale min-h-[44px]"
              onClick={() => setShowReminderPopup(true)}
            >
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen
            </Button>
          </div>
        </div>
      </div>

      <ReminderSettingsPopover open={showReminderPopup} onOpenChange={setShowReminderPopup} />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-3 pb-28 sm:px-6 lg:px-8 md:py-8 sm:pb-8">
        {/* Ansichts-Umschalter Woche / Monat */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant={viewType === 'week' ? 'default' : 'outline'}
            onClick={() => setViewType('week')}
            className="min-h-[44px] active:scale-95"
          >
            Woche
          </Button>
          <Button
            variant={viewType === 'month' ? 'default' : 'outline'}
            onClick={() => setViewType('month')}
            className="min-h-[44px] active:scale-95"
          >
            Monat
          </Button>
        </div>

        {/* Zeitraum-Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-xl font-semibold">{periodTitle}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" onClick={previousPeriod} className="h-11 w-11 p-0 rounded-full shadow-sm active:scale-95">
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button variant="outline" onClick={goToToday} className="h-11 px-4 rounded-full shadow-sm active:scale-95">
              Heute
            </Button>
            <Button variant="outline" onClick={nextPeriod} className="h-11 w-11 p-0 rounded-full shadow-sm active:scale-95">
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Haus-Legende */}
        <div className="flex flex-wrap gap-2 mb-4">
          {houses.map(house => (
            <div key={house.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/40">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getHouseColor(house.id, house.name) }} />
              <span className="text-xs font-medium">{house.name}</span>
            </div>
          ))}
        </div>

        {viewType === 'week' ? (
          /* ---------- WOCHENANSICHT ---------- */
          <div className="space-y-5">
            <Card>
              <CardContent className="p-3 md:p-4 space-y-2">
                {weekDays.map(day => {
                  const dayEvents = eventsForDay(day);
                  const todayFlag = isToday(day);
                  const hasWork = dayEvents.length > 0;
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'flex items-start gap-3 rounded-lg p-2.5',
                        hasWork ? 'bg-surface-tint' : 'bg-muted/20',
                        todayFlag && 'ring-2 ring-primary ring-inset'
                      )}
                    >
                      <div className={cn('w-14 shrink-0 text-sm', !hasWork && 'opacity-60')}>
                        <div className={cn('font-semibold', todayFlag && 'text-primary')}>
                          {format(day, 'EEE', { locale: de })}
                        </div>
                        <div className="text-xs text-muted-foreground">{format(day, 'd.', { locale: de })}</div>
                      </div>
                      {hasWork ? (
                        <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                          {dayEvents.map(event => {
                            const color = getHouseColor(event.house_id, event.house);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openDetail(event.taskId)}
                                style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-card border border-border/60 rounded-r-lg text-left active:scale-[0.99] transition-transform"
                              >
                                <Sparkles className="w-4 h-4 shrink-0" style={{ color }} />
                                <span className="font-medium text-sm truncate">{event.house}</span>
                                <span className="ml-auto text-sm text-muted-foreground shrink-0">
                                  {event.scheduledTime ? event.scheduledTime.slice(0, 5) : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center text-sm text-muted-foreground opacity-60">frei</div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Vorschau kommende Wochen */}
            {upcomingWeeks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Kommende Wochen</h3>
                <Card>
                  <CardContent className="p-3 md:p-4 space-y-2">
                    {upcomingWeeks.map(week => (
                      <div key={week.start.toISOString()} className="flex items-start gap-3">
                        <div className="w-28 shrink-0 text-xs text-muted-foreground pt-0.5">
                          {format(week.start, 'd. MMM', { locale: de })} – {format(week.end, 'd. MMM', { locale: de })}
                        </div>
                        <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                          {week.events.map(event => {
                            const color = getHouseColor(event.house_id, event.house);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openDetail(event.taskId)}
                                className="flex items-center gap-1.5 text-sm active:opacity-70"
                              >
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                <span className="font-medium">{format(event.date, 'EEE', { locale: de })}</span>
                                <span className="text-muted-foreground">· {event.house}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : (
          /* ---------- MONATSANSICHT ---------- */
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="grid grid-cols-7 gap-1">
                {weekdayHeader.map(d => (
                  <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">{d}</div>
                ))}
                {monthGridDays.map((day, idx) => {
                  const dayEvents = eventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const todayFlag = isToday(day);
                  const shown = dayEvents.slice(0, 3);
                  const hidden = dayEvents.length - shown.length;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'min-h-[76px] sm:min-h-[92px] p-1.5 border border-border rounded-sm',
                        isCurrentMonth ? 'bg-surface-tint' : 'bg-muted/40 text-muted-foreground',
                        todayFlag && 'ring-2 ring-primary ring-inset'
                      )}
                    >
                      <div className="text-sm font-medium mb-1">{format(day, 'd')}</div>
                      <div className="space-y-1">
                        {shown.map(event => {
                          const color = getHouseColor(event.house_id, event.house);
                          return (
                            <button
                              key={event.id}
                              type="button"
                              onClick={() => openDetail(event.taskId)}
                              style={{ backgroundColor: color }}
                              className="w-full text-[10px] sm:text-xs px-1.5 py-0.5 rounded text-white flex items-center gap-1 truncate active:opacity-80"
                              title={`${event.house}${event.scheduledTime ? ' · ' + event.scheduledTime.slice(0, 5) : ''}`}
                            >
                              <Sparkles className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {event.scheduledTime ? event.scheduledTime.slice(0, 5) + ' ' : ''}{event.house}
                              </span>
                            </button>
                          );
                        })}
                        {hidden > 0 && (
                          <div className="text-[10px] sm:text-xs text-muted-foreground">+{hidden} weitere</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
      </div>
    </div>
    </PullToRefresh>

    {/* Detail-Sheet: nur Ansicht, kein Ändern */}
    <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: selectedEvent ? getHouseColor(selectedEvent.house_id, selectedEvent.house) : '#999' }}
            />
            Reinigungsauftrag
          </SheetTitle>
        </SheetHeader>
        {selectedEvent ? (
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Unterkunft</div>
              <div className="font-medium text-sm mt-0.5">{selectedEvent.house}</div>
              {selectedEvent.houseAddress && (
                <div className="text-xs text-muted-foreground mt-0.5">{selectedEvent.houseAddress}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Datum</div>
                <div className="text-sm mt-0.5">{format(selectedEvent.date, 'EEE, d. MMM yyyy', { locale: de })}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Uhrzeit</div>
                <div className="text-sm mt-0.5">
                  {selectedEvent.scheduledTime ? selectedEvent.scheduledTime.slice(0, 5) : '—'}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <Badge variant="secondary" className="text-xs mt-1">{statusLabel(selectedEvent.status)}</Badge>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Putzkraft</div>
              <div className="text-sm mt-0.5">{selectedStaff ? selectedStaff.name : 'Nicht zugewiesen'}</div>
            </div>
            {selectedEvent.guestName && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Gast</div>
                <div className="text-sm mt-0.5">{selectedEvent.guestName}</div>
              </div>
            )}
            {selectedEvent.notes && (
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Notizen</div>
                <div className="text-sm mt-0.5 whitespace-pre-wrap">{selectedEvent.notes}</div>
              </div>
            )}
            <div className="pt-2">
              <SheetClose asChild>
                <Button className="w-full min-h-[44px]">Schliessen</Button>
              </SheetClose>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">Reinigungsauftrag nicht gefunden</p>
        )}
      </SheetContent>
    </Sheet>

    {/* Mobile Bottom Navigation */}
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-tint border-t border-primary/20 pb-[env(safe-area-inset-bottom)] shadow-lg">
      <CopyrightLine className="py-1 border-b border-primary/20" />
      <div className="flex justify-around items-center h-16">
        <Link to="/" className="flex-1">
          <button className="relative w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <Home className="w-6 h-6" strokeWidth={2.25} />
            <span className="font-medium text-sm">Reinigung</span>
            {totalCleaningTasks > 0 && (
              <span className="absolute top-1 right-1/4 bg-primary text-primary-foreground text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                {totalCleaningTasks}
              </span>
            )}
          </button>
        </Link>
        <Link to="/calendar" className="flex-1">
          <button className="w-full h-16 flex flex-col items-center justify-center gap-1 text-primary">
            <CalendarIcon className="w-6 h-6" strokeWidth={2.25} />
            <span className="font-medium text-sm">Kalender</span>
          </button>
        </Link>
        <button
          onClick={() => setShowReminderPopup(true)}
          className="flex-1 w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground relative"
        >
          <Bell className="w-6 h-6" strokeWidth={2.25} />
          <span className="font-medium text-sm">Benachrichtigung</span>
        </button>
        <button
          onClick={() => chatProps.setIsChatOpen(true)}
          className="flex-1 w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground relative"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={2.25} />
          <span className="font-medium text-sm">Chat</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </nav>
    </>
  );
};

export default Calendar;
