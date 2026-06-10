import React, { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import Footer, { CopyrightLine } from '@/components/Footer';
import { useNotify } from '@/hooks/useNotify';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import { supabase } from '@/integrations/supabase/client';
import { AMELA_PROVIDER_ID } from '@/constants/app';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAStatusBar from '@/components/PWAStatusBar';
import { usePWA } from '@/hooks/usePWA';
import PullToRefresh from '@/components/PullToRefresh';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingCardSettings, { useBookingCardConfig } from "@/components/BookingCardSettings";
import AmelaEntryRow from "@/components/amela/AmelaEntryRow";
import CleaningReminderBanner from "@/components/amela/CleaningReminderBanner";
import ReminderSettingsPopover from "@/components/amela/ReminderSettingsPopover";
import { ChatButton } from '@/components/PortalChat';
import { usePortalMessages } from '@/hooks/usePortalMessages';
import {
  Home,
  Search,
  Bell,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageCircle,
  RotateCw,
  SearchX,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import type { TimeFilter } from '@/types/booking';

type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
type HouseFilter = 'all' | string;
type ProviderFilter = 'all' | 'unassigned' | string;

const STATUS_FILTERS = {
  all: 'Alle Status',
  scheduled: 'Geplant',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  delayed: 'Verzögert',
  cancelled: 'Storniert'
};


const TIME_FILTERS = {
  all: 'Alle Zeiten',
  week: 'Nächste Woche',
  month: 'Nächster Monat',
  '3months': 'Nächste 3 Monate',
};

interface CleaningPortalProps {
  chatProps: {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
  };
}

const CleaningPortal = ({ chatProps }: CleaningPortalProps) => {
  const { notify, preferences } = useNotify();
  const { unreadCount } = usePortalMessages();
  const { isInstalled, isOnline } = usePWA();
  const pwaBarVisible = isInstalled || !isOnline;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [houseFilter, setHouseFilter] = useState<HouseFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  // Portal zeigt nur Amela-zugewiesene Reinigungen
  const [providerFilter] = useState<ProviderFilter>(AMELA_PROVIDER_ID);
  const [showReminderPopup, setShowReminderPopup] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [newTaskCount, setNewTaskCount] = useState(0);
  const [showCheckedIn] = useState(true);

  const { config: cardConfig, updateConfig: updateCardConfig, loading: configLoading } = useBookingCardConfig();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const handleNotificationClick = () => {
    setHasUnreadNotifications(false);
    setNewTaskCount(0);
    setShowReminderPopup(true);
  };



  const {
    filteredBookings: filteredEntries,
    loading: bookingsLoading,
    error: bookingsError,
    totalCleaningTasks,
    updateTaskStatus,
    updateTaskStaff,
    updateTaskDateTime,
    forceRefresh,
  } = useBookings();




  // Realtime: NUR INSERT für Bell-Badge/Toast. Datenrefresh + UPDATE-Events erledigt useBookings.
  useEffect(() => {
    const channel = supabase
      .channel('amela-portal-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_tasks',
          filter: `provider_id=eq.${AMELA_PROVIDER_ID}`,
        },
        (payload) => {
          console.log('🆕 Neuer Reinigungsauftrag:', payload);
          setHasUnreadNotifications(true);
          setNewTaskCount((prev) => prev + 1);
          notify({
            title: '🆕 Neuer Reinigungsauftrag',
            description: 'Ein neuer Auftrag wurde zugewiesen.',
            eventType: 'new_task',
            duration: 5000,
          });
          if (preferences?.sound_notifications) {
            const audio = new Audio('/notification-sound.mp3');
            audio.play().catch((e) => console.log('Sound konnte nicht abgespielt werden:', e));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notify, preferences]);

  const { houses: allHouses = [], loading: housesLoading } = useHouses();
  const houses = allHouses.filter((house) => house.rental_type === 'tourist');

  const { staff = [], loading: staffLoading } = useCleaningStaff();

  const currentFilteredEntries = filteredEntries(
    debouncedSearchTerm,
    statusFilter,
    staffFilter,
    timeFilter,
    houseFilter,
    providerFilter,
    showCheckedIn
  );

  const showError = (description: string) =>
    notify({ title: 'Fehler', description, variant: 'destructive', eventType: 'info' });

  const handleStatusUpdate = useCallback(
    async (taskId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed') => {
      const result = await updateTaskStatus(taskId, newStatus);
      if (!result.success) {
        showError('Status konnte nicht aktualisiert werden.');
        return;
      }
      notify({
        title: 'Status aktualisiert',
        description: `Der Status wurde erfolgreich auf "${STATUS_FILTERS[newStatus as StatusFilter]}" geändert.`,
        eventType: 'status_update',
      });
    },
    [updateTaskStatus, notify]
  );

  const handleStaffUpdate = useCallback(
    async (taskId: string, staffId: string | null) => {
      const result = await updateTaskStaff(taskId, staffId);
      if (!result.success) {
        showError('Zuweisung konnte nicht aktualisiert werden.');
        return;
      }
      const staffName = staffId ? staff.find((s) => s.id === staffId)?.name || 'Unbekannt' : 'Nicht zugewiesen';
      notify({
        title: 'Zuweisung aktualisiert',
        description: `Die Aufgabe wurde ${staffName} zugewiesen.`,
        eventType: 'staff_change',
      });
    },
    [updateTaskStaff, staff, notify]
  );

  const handleDateTimeUpdateFromCard = useCallback(
    async (taskId: string, date: string, time: string) => {
      const result = await updateTaskDateTime(taskId, new Date(date), time);
      if (!result.success) {
        showError('Termin konnte nicht aktualisiert werden.');
        return;
      }
      notify({
        title: 'Termin aktualisiert',
        description: 'Der Termin wurde erfolgreich aktualisiert.',
        eventType: 'task_change',
      });
    },
    [updateTaskDateTime, notify]
  );

  const handleNotesUpdate = useCallback(
    async (taskId: string, notes: string) => {
      try {
        const { error } = await supabase.from('service_tasks').update({ notes }).eq('id', taskId);
        if (error) throw error;
        notify({
          title: 'Notizen aktualisiert',
          description: 'Die Notizen wurden erfolgreich gespeichert.',
          eventType: 'task_change',
        });
      } catch (e) {
        console.error('Error updating notes:', e);
        showError('Notizen konnten nicht aktualisiert werden.');
      }
    },
    [notify]
  );


  if (housesLoading || staffLoading || configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Reinigungsportal...</p>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <h2 className="text-xl font-semibold">Verbindungsfehler</h2>
            <p className="text-sm text-muted-foreground break-words">{bookingsError}</p>
            <Button onClick={() => forceRefresh()} className="hover-scale">
              <RotateCw className="w-4 h-4 mr-2" />
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleRefresh = async () => {
    await forceRefresh();
  };

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh} disabled={bookingsLoading}>

    <div className="min-h-screen bg-background">
      <PWAStatusBar />
      <div className={`${pwaBarVisible ? 'pt-12' : 'pt-0'} md:pt-0`}>
      {/* Header */}
        <header className="hidden sm:block bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground">Amela Reinigungsportal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="hidden sm:block">
                <ChatButton onClick={() => chatProps.setIsChatOpen(true)} unreadCount={unreadCount} />
              </div>
              <div className={cardConfig.showMobileSettingsButton ? "block" : "hidden sm:block"}>
                <BookingCardSettings
                  config={cardConfig}
                  onConfigChange={updateCardConfig}
                />
              </div>
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <div className="hidden sm:block bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          <div className="flex space-x-6">
            <Link to="/">
              <Button variant="default" size="sm" className="my-2 hover-scale min-h-[44px]">
                <Home className="w-4 h-4 mr-2" />
                Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="my-2 hover-scale min-h-[44px]">
                <Calendar className="w-4 h-4 mr-2" />
                Kalender
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className={`my-2 hover-scale relative min-h-[44px] ${hasUnreadNotifications ? 'animate-bell-ring' : ''}`}
              onClick={handleNotificationClick}
            >
              <Bell className={`w-4 h-4 mr-2 ${hasUnreadNotifications ? 'text-status-delayed' : ''}`} />
              Benachrichtigungen
              {newTaskCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {newTaskCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>


      {/* Erinnerungs-Einstellungen Popup (über Glocken-Icon) */}
      <ReminderSettingsPopover open={showReminderPopup} onOpenChange={setShowReminderPopup} />




      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 pt-1 pb-28 md:px-4 md:py-8 lg:px-8 sm:pb-3 md:pb-8">
        <div className="space-y-3 md:space-y-6">

          {/* Erinnerungs-Banner */}
          <CleaningReminderBanner entries={currentFilteredEntries} />



          {/* Haus-Filter-Karten */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 md:grid-cols-3 lg:grid-cols-4">
            {houses.map((house) => {
              const active = houseFilter === house.id;
              return (
                <button
                  key={house.id}
                  onClick={() => setHouseFilter(active ? 'all' : house.id)}
                  className={`min-h-[56px] rounded-lg border-2 px-3 py-2 text-left transition-all active:scale-95 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-primary/20 bg-surface-tint hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold truncate">{house.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Zeitraum-Filter-Karten */}
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            {([
              { key: 'thisWeek' as TimeFilter, label: 'Diese Woche' },
              { key: 'nextWeek' as TimeFilter, label: 'Nächste Woche' },
              { key: 'thisMonth' as TimeFilter, label: 'Diesen Monat' },
              { key: 'nextMonth' as TimeFilter, label: 'Nächsten Monat' },
            ]).map(({ key, label }) => {
              const active = timeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setTimeFilter(active ? 'all' : key)}
                  className={`min-h-[56px] rounded-lg border-2 px-3 py-2 text-left transition-all active:scale-95 ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground shadow-md'
                      : 'border-primary/20 bg-surface-tint hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-bold truncate">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>


          {(houseFilter !== 'all' || timeFilter !== 'all') && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] text-xs text-muted-foreground"
                onClick={() => {
                  setHouseFilter('all');
                  setTimeFilter('all');
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          )}


          {/* Booking and Standalone Cleaning Cards */}
          <div className="space-y-3 md:space-y-4">
            {bookingsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={`skeleton-${i}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))
            ) : currentFilteredEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 md:p-12 text-center space-y-3">
                  <SearchX className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Keine Reinigungsaufträge gefunden</h3>
                  <p className="text-sm text-muted-foreground">
                    {debouncedSearchTerm
                      ? `Keine Ergebnisse für "${debouncedSearchTerm}"`
                      : 'Versuche andere Filter oder prüfe ob Aufträge vorhanden sind.'}
                  </p>
                  {(statusFilter !== 'scheduled' || houseFilter !== 'all' || staffFilter !== 'all' || timeFilter !== 'all' || searchTerm) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setStatusFilter('scheduled');
                        setHouseFilter('all');
                        setStaffFilter('all');
                        setTimeFilter('all');
                        setSearchTerm('');
                      }}
                    >
                      Filter zurücksetzen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
               currentFilteredEntries.map((entry, idx) => (
                <AmelaEntryRow
                  key={entry.data.id}
                  entry={entry}
                  staff={staff}
                  onStatusUpdate={handleStatusUpdate}
                  onStaffUpdate={handleStaffUpdate}
                  onDateTimeUpdate={handleDateTimeUpdateFromCard}
                  onTaskNotesUpdate={handleNotesUpdate}
                  colorIndex={idx}
                />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </div>
    </PullToRefresh>

    {/* Mobile Bottom Navigation */}
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-surface-tint border-t border-surface-tint pb-[env(safe-area-inset-bottom)] shadow-lg">
      <CopyrightLine className="py-1 border-b border-surface-tint" />
      <div className="flex justify-around items-center h-16">
        <Link to="/" className="flex-1">
          <button className="relative w-full h-16 flex flex-col items-center justify-center gap-1 text-primary">
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
          <button className="w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground">
            <Calendar className="w-6 h-6" strokeWidth={2.25} />
            <span className="font-medium text-sm">Kalender</span>
          </button>
        </Link>
        <button
          onClick={handleNotificationClick}
          className={`flex-1 w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground relative ${hasUnreadNotifications ? 'animate-bell-ring' : ''}`}
        >
          <Bell className="w-6 h-6" strokeWidth={2.25} />
          <span className="font-medium text-sm">Benachrichtigung</span>
          {newTaskCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center animate-pulse">
              {newTaskCount}
            </span>
          )}
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

export default CleaningPortal;