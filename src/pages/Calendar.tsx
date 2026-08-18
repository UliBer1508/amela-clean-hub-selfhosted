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
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ChatButton } from '@/components/PortalChat';
import { usePortalMessages } from '@/hooks/usePortalMessages';
import { cn } from '@/lib/utils';
import { getGuestName } from '@/lib/guestHelpers';
// In diesem Repo heisst die Konstante noch AMELA_PROVIDER_ID (im Boris-Repo
// wurde sie am 21.07.2026 auf PROVIDER_ID umbenannt). Alias wie in
// useBookings.ts:11, damit der uebrige Code in beiden Portalen gleich bleibt.
import { AMELA_PROVIDER_ID as PROVIDER_ID } from '@/constants/app';
import Belegungsraster, { type RasterAufgabe, type RasterHaus } from '@/components/Belegungsraster';
import { getHouseColors, type RasterBuchung } from '@/lib/belegung';

type ViewType = 'week' | 'month';

// Statuswerte, die eine Reinigung als "nicht mehr aktiv" markieren -> ausblenden.
const CANCELLED_STATUSES = new Set(['cancelled', 'storniert', 'abgebrochen']);

// Hausfarbe aus der gemeinsamen Quelle (@/lib/belegung). Vorher stand hier eine
// eigene Tabelle mit Grün/Violett — dasselbe Haus hatte damit in Hausverwaltung,
// Amela- und Teuni-Portal drei verschiedene Farben. Der zweite Parameter bleibt
// aus Aufrufer-Sicht erhalten; die houseId wird nicht mehr gebraucht.
const getHouseColor = (_houseId: string, houseName?: string) =>
  getHouseColors(houseName || '').base;

interface CleaningEvent {
  id: string;
  taskId: string;
  date: Date;
  house: string;
  house_id: string;
  /** null bei Reinigungen ohne Buchung (Fenster-/Generalreinigung) */
  bookingId?: string | null;
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
  const { totalCleaningTasks, standaloneCleanings } = useBookings();
  const { houses } = useHouses();
  const { staff: cleaningStaff } = useCleaningStaff();

  // Reinigungen dieses Portals. ZWEI Quellen, beide mit Provider-Filter:
  //
  // 1. Reinigungen AN EINER BUCHUNG (Regelfall, Termin = Check-in-Tag).
  // 2. Reinigungen OHNE BUCHUNG (`booking_id is null`) — Fensterreinigung,
  //    General-/Saisonreinigung. Sie fehlten hier bisher vollständig — im
  //    Reinigungs-Tab der Hausverwaltung gibt es sie seit dem 21.07.2026
  //    (CODE-INDEX Abschnitt 9, "Reinigung OHNE Buchung").
  //
  // Der Filter `provider_id === PROVIDER_ID` setzt die dokumentierte Regel um
  // ("Das Portal zeigt ausschließlich Reinigungen mit provider_id = …").
  // Die Startseite filtert seit jeher so (CleaningPortal.tsx), der Kalender
  // nicht — er verließ sich unausgesprochen auf die Datenbank.
  const cleaningEvents = useMemo<CleaningEvent[]>(() => {
    const events: CleaningEvent[] = [];

    (allBookings || []).forEach(booking => {
      if (booking.status === 'cancelled') return;
      const guestName = getGuestName(booking);
      booking.service_tasks?.forEach(task => {
        if (task.service_type !== 'cleaning') return;
        if (task.provider_id !== PROVIDER_ID) return;
        if (CANCELLED_STATUSES.has(String(task.status || '').toLowerCase())) return;
        if (!task.scheduled_date) return;
        events.push({
          id: `cleaning-${task.id}`,
          taskId: task.id,
          date: new Date(task.scheduled_date),
          house: booking.houses?.name || 'Unbekannt',
          house_id: booking.house_id,
          bookingId: booking.id,
          status: task.status,
          scheduledTime: task.scheduled_time ?? null,
          notes: task.notes ?? null,
          assignedStaffId: task.assigned_staff_id ?? null,
          houseAddress: booking.houses?.address ?? null,
          guestName,
        });
      });
    });

    (standaloneCleanings || []).forEach(task => {
      if (task.provider_id !== PROVIDER_ID) return;
      if (CANCELLED_STATUSES.has(String(task.status || '').toLowerCase())) return;
      if (!task.scheduled_date) return;
      events.push({
        id: `cleaning-${task.id}`,
        taskId: task.id,
        date: new Date(task.scheduled_date),
        house: task.houses?.name || 'Unbekannt',
        house_id: task.house_id,
        bookingId: null,
        status: task.status,
        scheduledTime: task.scheduled_time ?? null,
        notes: task.notes ?? null,
        assignedStaffId: task.assigned_staff_id ?? null,
        houseAddress: task.houses?.address ?? null,
        guestName: undefined,
      });
    });

    return events;
  }, [allBookings, standaloneCleanings]);

  const eventsForDay = (day: Date) =>
    cleaningEvents
      .filter(e => isSameDay(e.date, day))
      .sort((a, b) => (a.scheduledTime || '').localeCompare(b.scheduledTime || ''));

  // ---------------------------------------------------------------------
  // Daten für das Belegungsraster
  // ---------------------------------------------------------------------
  // Das Raster zeigt Belegung UND Auftrag im selben Bild. Es ersetzt die
  // frühere Tagesliste plus "Kommende Wochen": vier Wochen untereinander,
  // darunter je Woche die Aufträge im Klartext.

  const rasterHaeuser = useMemo<RasterHaus[]>(
    () => houses.map(h => ({ id: h.id, name: h.name })),
    [houses]
  );

  const rasterBuchungen = useMemo<RasterBuchung[]>(
    () =>
      (allBookings || []).map(b => ({
        id: b.id,
        house_id: b.house_id,
        check_in: b.check_in,
        check_out: b.check_out,
        gastName: getGuestName(b),
        status: b.status,
      })),
    [allBookings]
  );

  // Wäschelieferungen: KEIN Auftrag für dieses Portal, nur Information —
  // ohne frische Wäsche kann nicht gereinigt werden. Sie erscheinen deshalb
  // nur als schmaler Streifen in der Zelle, nicht als Symbol.
  const rasterWaesche = useMemo<RasterAufgabe[]>(() => {
    const out: RasterAufgabe[] = [];
    (allBookings || []).forEach(booking => {
      if (booking.status === 'cancelled') return;
      booking.linen_orders?.forEach(order => {
        if (CANCELLED_STATUSES.has(String(order.status || '').toLowerCase())) return;
        if (!order.delivery_date) return;
        out.push({
          id: `linen-${order.id}`,
          house_id: booking.house_id,
          datum: order.delivery_date.substring(0, 10),
          uhrzeit: order.delivery_time ?? null,
          status: order.status ?? null,
          booking_id: booking.id,
          titel: 'Wäschelieferung',
        });
      });
    });
    return out;
  }, [allBookings]);

  const rasterAufgaben = useMemo<RasterAufgabe[]>(() => {
    const bekannteHaeuser = new Set(houses.map(h => h.id));
    return cleaningEvents
      .filter(e => bekannteHaeuser.has(e.house_id))
      .map(e => {
        const buchung = e.bookingId
          ? (allBookings || []).find(b => b.id === e.bookingId)
          : undefined;
        const anreise = buchung
          ? (allBookings || []).find(
              b => b.house_id === e.house_id && b.check_in.substring(0, 10) === buchung.check_in.substring(0, 10)
            )
          : undefined;
        const abreise = buchung
          ? (allBookings || []).find(
              b =>
                b.house_id === e.house_id &&
                b.id !== buchung.id &&
                b.check_out.substring(0, 10) === buchung.check_in.substring(0, 10)
            )
          : undefined;

        const hinweis = !buchung
          ? (e.notes ? e.notes.slice(0, 60) : 'Reinigung ohne Buchung')
          : abreise
            ? `Wechsel: ${getGuestName(abreise) || 'Gast'} reist ab, ${getGuestName(anreise ?? buchung) || 'Gast'} kommt an`
            : `Anreise ${getGuestName(buchung) || 'Gast'}`;

        return {
          id: e.taskId,
          house_id: e.house_id,
          datum: format(e.date, 'yyyy-MM-dd'),
          uhrzeit: e.scheduledTime,
          status: e.status ?? null,
          booking_id: e.bookingId ?? null,
          titel: `${e.house} reinigen`,
          hinweis,
        };
      });
  }, [cleaningEvents, houses, allBookings]);

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

  // Die Belegungsansicht zeigt VIER Wochen; der Titel muss denselben Zeitraum
  // nennen, sonst steht über dem Raster eine Woche, die es gar nicht abgrenzt.
  const periodTitle =
    viewType === 'week'
      ? `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} – ${format(endOfWeek(addWeeks(currentDate, 3), { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`
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
            Belegung
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
          /* ---------- BELEGUNGSRASTER (vier Wochen) ---------- */
          <Card>
            <CardContent className="p-3 md:p-4">
              <Belegungsraster
                haeuser={rasterHaeuser}
                buchungen={rasterBuchungen}
                meineAufgaben={rasterAufgaben}
                infoAufgaben={rasterWaesche}
                startDatum={currentDate}
                wochen={4}
                meinSymbol="🧹"
                meinName="Reinigung"
                infoName="Wäsche"
                onAufgabeClick={openDetail}
              />
            </CardContent>
          </Card>
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
