import React, { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import Footer from '@/components/Footer';
import { useNotify } from '@/hooks/useNotify';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/utils/date';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AMELA_PROVIDER_ID } from '@/constants/app';
import PWAInstallButton from '@/components/PWAInstallButton';
import NotificationSettings from '@/components/NotificationSettings';
import PWAStatusBar from '@/components/PWAStatusBar';
import PullToRefresh from '@/components/PullToRefresh';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import BookingCardSettings, { useBookingCardConfig } from "@/components/BookingCardSettings";
import ConfigurableBookingCard from "@/components/ConfigurableBookingCard";
import StandaloneCleaningCard from "@/components/StandaloneCleaningCard";
import AddStandaloneCleaningDialog from "@/components/AddStandaloneCleaningDialog";
import { ChatButton } from '@/components/PortalChat';
import { usePortalMessages } from '@/hooks/usePortalMessages';
import {
  Home,
  Search,
  Filter,
  Bell,
  Calendar,
  Users,
  ArrowLeft,
  UserPlus,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
type StaffFilter = 'all' | 'assigned' | 'unassigned';
type HouseFilter = 'all' | string;
type TimeFilter = 'all' | 'week' | 'month' | '3months';
type ProviderFilter = 'all' | 'unassigned' | string;

interface TaskEditingState {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
}

const STATUS_FILTERS = {
  all: 'Alle Status',
  scheduled: '📅 Geplant',
  in_progress: '⏳ In Bearbeitung',
  completed: '✅ Abgeschlossen', 
  delayed: '⚠️ Verzögert',
  cancelled: '❌ Storniert'
};


const TIME_FILTERS = {
  all: '🕐 Alle Zeiten',
  week: '📅 n. Woche', 
  month: '🗓️ n. Monat',
  '3months': '📆 n. 3 Monate',
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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');
  const [staffFilter, setStaffFilter] = useState<string>('all'); // "all" = alle anzeigen
  const [houseFilter, setHouseFilter] = useState<HouseFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  // Portal zeigt nur Amela-zugewiesene Reinigungen
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>(AMELA_PROVIDER_ID);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [editingTask, setEditingTask] = useState<TaskEditingState | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [newTaskCount, setNewTaskCount] = useState(0);
  const [showCheckedIn, setShowCheckedIn] = useState(true);
  
  // Booking card configuration
  const { config: cardConfig, updateConfig: updateCardConfig, loading: configLoading } = useBookingCardConfig();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Service Provider Filter ist fest auf Amela gesetzt (ID: 9de6e071-7e89-4d66-9433-a5f01acaa493)

  // Handler für Benachrichtigungsklick
  const handleNotificationClick = () => {
    // Animation stoppen
    setHasUnreadNotifications(false);
    setNewTaskCount(0);
    
    // Benachrichtigungseinstellungen öffnen/schließen
    setShowNotificationSettings(!showNotificationSettings);
  };

  const { 
    bookings = [],
    standaloneCleanings = [],
    combinedEntries = [],
    filteredBookings: filteredEntries,
    loading: bookingsLoading, 
    error: bookingsError,
    totalCleaningTasks: hookTotalCleaningTasks,
    refetch: refetchBookings,
    forceRefresh,
    lastRefresh
  } = useBookings();

  // Realtime-Überwachung NUR für Notifications (Datenrefresh erfolgt in useBookings)
  useEffect(() => {
    const channel = supabase
      .channel('amela-portal-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'service_tasks',
          filter: `provider_id=eq.${AMELA_PROVIDER_ID}`
        },
        (payload) => {
          console.log('🆕 Neuer Reinigungsauftrag:', payload);
          setHasUnreadNotifications(true);
          setNewTaskCount(prev => prev + 1);
          notify({
            title: "🆕 Neuer Reinigungsauftrag",
            description: "Ein neuer Auftrag wurde zugewiesen.",
            eventType: "new_task",
            duration: 5000,
          });
          if (preferences?.sound_notifications) {
            const audio = new Audio('/notification-sound.mp3');
            audio.play().catch(e => console.log('Sound konnte nicht abgespielt werden:', e));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'service_tasks',
          filter: `provider_id=eq.${AMELA_PROVIDER_ID}`
        },
        (payload) => {
          console.log('🔄 Reinigungsauftrag aktualisiert:', payload);
          setHasUnreadNotifications(true);
          notify({
            title: "🔄 Auftrag aktualisiert",
            description: "Ein Reinigungsauftrag wurde geändert.",
            eventType: "task_change",
            duration: 4000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [notify, preferences]);

  const { 
    houses: allHouses = [], 
    loading: housesLoading 
  } = useHouses();

  // Nur touristische Objekte anzeigen
  const houses = allHouses.filter(house => house.rental_type === 'tourist');

  const { 
    staff = [], 
    loading: staffLoading 
  } = useCleaningStaff();

  const currentFilteredEntries = filteredEntries(
    debouncedSearchTerm,
    statusFilter,
    staffFilter,
    timeFilter,
    houseFilter,
    providerFilter,
    showCheckedIn
  );

  const totalCleaningTasks = hookTotalCleaningTasks;

  const handleStatusUpdate = useCallback(async (taskId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed') => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          status_changed_by: 'Amela',
          status_changed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      notify({
        title: "Status aktualisiert",
        description: `Der Status wurde erfolgreich auf "${STATUS_FILTERS[newStatus as StatusFilter]}" geändert.`,
        eventType: "status_update"
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating task status:', error);
      notify({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [notify, refetchBookings]);

  const handleStaffUpdate = useCallback(async (taskId: string, staffId: string | null) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({ 
          assigned_staff_id: staffId,
        })
        .eq('id', taskId);

      if (error) throw error;

      const staffName = staffId ? staff.find(s => s.id === staffId)?.name || 'Unbekannt' : 'Nicht zugewiesen';
      
      notify({
        title: "Zuweisung aktualisiert",
        description: `Die Aufgabe wurde ${staffName} zugewiesen.`,
        eventType: "staff_change"
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating staff assignment:', error);
      notify({
        title: "Fehler",
        description: "Zuweisung konnte nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [notify, refetchBookings, staff]);

  const handleEditDateTime = (task: TaskEditingState) => {
    setEditingTask(task);
    setSelectedDate(new Date(task.scheduled_date));
    setSelectedTime(task.scheduled_time || '');
  };

  const handleDateTimeUpdate = useCallback(async () => {
    if (!editingTask || !selectedDate) return;

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('service_tasks')
        .update({ 
          scheduled_date: dateString,
          scheduled_time: selectedTime || null
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      notify({
        title: "Termin aktualisiert",
        description: `Der Termin wurde erfolgreich aktualisiert.`,
        eventType: "task_change"
      });

      refetchBookings();
      setEditingTask(null);
      setSelectedDate(undefined);
      setSelectedTime('');
    } catch (error) {
      console.error('Error updating task datetime:', error);
      notify({
        title: "Fehler",
        description: "Termin konnte nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [editingTask, selectedDate, selectedTime, notify, refetchBookings]);

  const handleDateTimeUpdateFromCard = useCallback(async (taskId: string, date: string, time: string) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          scheduled_date: date,
          scheduled_time: time || null
        })
        .eq('id', taskId);

      if (error) throw error;

      notify({
        title: "Termin aktualisiert",
        description: "Der Termin wurde erfolgreich aktualisiert.",
        eventType: "task_change"
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating task datetime from card:', error);
      notify({
        title: "Fehler",
        description: "Termin konnte nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [notify, refetchBookings]);

  const handleBookingNotesUpdate = useCallback(async (bookingId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ notes })
        .eq('id', bookingId);

      if (error) throw error;

      notify({
        title: "Notizen aktualisiert",
        description: "Die Buchungsnotizen wurden erfolgreich gespeichert.",
        eventType: "task_change"
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating booking notes:', error);
      notify({
        title: "Fehler",
        description: "Notizen konnten nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [notify, refetchBookings]);

  const handleTaskNotesUpdate = useCallback(async (taskId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({ notes })
        .eq('id', taskId);

      if (error) throw error;

      notify({
        title: "Aufgaben-Notizen aktualisiert",
        description: "Die Aufgaben-Notizen wurden erfolgreich gespeichert.",
        eventType: "task_change"
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating task notes:', error);
      notify({
        title: "Fehler",
        description: "Aufgaben-Notizen konnten nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [notify, refetchBookings]);

  const handleStandaloneNotesUpdate = useCallback(async (taskId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({ notes })
        .eq('id', taskId);

      if (error) throw error;

      notify({
        title: "Notizen aktualisiert",
        description: "Die Notizen wurden erfolgreich gespeichert.",
        eventType: "task_change"
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating standalone cleaning notes:', error);
      notify({
        title: "Fehler",
        description: "Notizen konnten nicht aktualisiert werden.",
        variant: "destructive",
        eventType: "info"
      });
    }
  }, [notify, refetchBookings]);

  if (bookingsLoading || housesLoading || staffLoading || configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade Reinigungsportal...</p>
        </div>
      </div>
    );
  }

  if (bookingsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Fehler beim Laden der Buchungen: {bookingsError}</p>
        </div>
      </div>
    );
  }

  const handleRefresh = async () => {
    await forceRefresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={bookingsLoading}>
    <div className="min-h-screen bg-background">
      <PWAStatusBar />
      <div className="pt-12 md:pt-0">
      {/* Header */}
        <header className="bg-card border-b border-border">
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
              <ChatButton onClick={() => chatProps.setIsChatOpen(true)} unreadCount={unreadCount} />
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

      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex space-x-6">
            <Link to="/">
              <Button variant="default" size="sm" className="my-2 hover-scale min-h-[44px]">
                🏠 Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="my-2 hover-scale min-h-[44px]">
                📅 Kalender
              </Button>
            </Link>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="my-2 hover-scale min-h-[44px]">
                👥 Putzkräfte
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`my-2 hover-scale relative min-h-[44px] ${hasUnreadNotifications ? 'animate-bell-ring' : ''}`}
              onClick={handleNotificationClick}
            >
              <Bell className={`w-4 h-4 mr-2 ${hasUnreadNotifications ? 'text-orange-500' : ''}`} />
              🔔 Benachrichtigungen
              {newTaskCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {newTaskCount}
                </span>
              )}
            </Button>
          </div>
          
          {/* Mobile Navigation - Single Row */}
          <div className="sm:hidden flex justify-around items-center gap-1 py-2">
            <Link to="/">
              <Button variant="default" size="sm" className="relative flex items-center justify-center min-h-[44px] min-w-[44px] p-2 hover-scale">
                <span className="text-xl">🏠</span>
                {totalCleaningTasks > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary text-secondary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {totalCleaningTasks}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 hover-scale">
                <span className="text-xl">📅</span>
              </Button>
            </Link>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 hover-scale">
                <span className="text-xl">👥</span>
              </Button>
            </Link>
            <Button
              variant="ghost" 
              size="sm" 
              className={`relative flex items-center justify-center min-h-[44px] min-w-[44px] p-2 hover-scale ${hasUnreadNotifications ? 'animate-bell-ring' : ''}`}
              onClick={handleNotificationClick}
            >
              <span className={`text-xl ${hasUnreadNotifications ? 'brightness-75' : ''}`}>🔔</span>
              {newTaskCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {newTaskCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      {showNotificationSettings && (
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <NotificationSettings />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-8 lg:px-8">
        <div className="space-y-4 md:space-y-6">
          {/* Search and Filters Toggle */}
          <Card className="shadow-sm border border-border">
            <CardContent className="p-3 md:p-4">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full flex items-center justify-between text-left hover:bg-muted/50 rounded-lg p-2 transition-colors min-h-[44px]"
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground text-xs md:text-sm">🔍 Such & Filter</span>
                </div>
                {isFiltersOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              
              {isFiltersOpen && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  <div className="flex items-center space-x-2">
                    <Search className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground text-xs md:text-sm">🔍 Suche</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Nach Gast, Haus oder Adresse suchen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 min-h-[44px]"
                      />
                      <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      <Checkbox 
                        id="showCheckedIn"
                        checked={showCheckedIn}
                        onCheckedChange={(checked) => setShowCheckedIn(checked === true)}
                      />
                      <Label htmlFor="showCheckedIn" className="text-xs md:text-sm cursor-pointer whitespace-nowrap">
                        ⚠️ Auch eingecheckt
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground text-xs md:text-sm">🔧 Filter</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_FILTERS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={staffFilter} onValueChange={(value: StaffFilter) => setStaffFilter(value)}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Putzkraft" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Putzkräfte</SelectItem>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={houseFilter} onValueChange={(value: HouseFilter) => setHouseFilter(value)}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Haus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Häuser</SelectItem>
                        {houses.map((house) => (
                          <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Zeitraum" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIME_FILTERS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Provider-Filter ist im Amela-Portal fest auf Amela gesetzt */}
                    {/* Das Dropdown wird nicht angezeigt, um Verwirrung zu vermeiden */}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground">
                      {currentFilteredEntries.length} von {totalCleaningTasks} Aufträgen
                    </span>
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {lastRefresh && (
            <p className="text-xs text-muted-foreground text-center">
              Zuletzt aktualisiert: {format(lastRefresh, 'HH:mm:ss', { locale: de })}
            </p>
          )}

          {/* Booking and Standalone Cleaning Cards */}
          <div className="space-y-3 md:space-y-4">
            {currentFilteredEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 md:p-12 text-center space-y-3">
                  <div className="text-5xl">🔍</div>
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
              currentFilteredEntries.map((entry) => {
                if (entry.type === 'booking') {
                  return (
                    <ConfigurableBookingCard
                      key={entry.data.id}
                      booking={entry.data}
                      config={cardConfig}
                      staff={staff}
                      onStatusUpdate={handleStatusUpdate}
                      onStaffUpdate={handleStaffUpdate}
                      onDateTimeUpdate={handleDateTimeUpdateFromCard}
                      onBookingNotesUpdate={handleBookingNotesUpdate}
                      onTaskNotesUpdate={handleTaskNotesUpdate}
                      formatDateTime={formatDateTime}
                    />
                  );
                } else {
                  return (
                    <StandaloneCleaningCard
                      key={entry.data.id}
                      cleaning={entry.data}
                      config={cardConfig}
                      staff={staff}
                      onStatusUpdate={handleStatusUpdate}
                      onStaffUpdate={handleStaffUpdate}
                      onDateTimeUpdate={handleDateTimeUpdateFromCard}
                      onNotesUpdate={handleStandaloneNotesUpdate}
                      formatDateTime={formatDateTime}
                    />
                  );
                }
              })
            )}
          </div>
        </div>
      </main>
      <Footer />
      </div>
    </div>
    </PullToRefresh>
  );
};

export default CleaningPortal;