import React, { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useNotify } from '@/hooks/useNotify';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/utils/date';
import { format } from 'date-fns';
import PWAInstallButton from '@/components/PWAInstallButton';
import NotificationSettings from '@/components/NotificationSettings';
import PWAStatusBar from '@/components/PWAStatusBar';
import PullToRefresh from '@/components/PullToRefresh';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingCardSettings, { useBookingCardConfig } from "@/components/BookingCardSettings";
import ConfigurableBookingCard from "@/components/ConfigurableBookingCard";
import StandaloneCleaningCard from "@/components/StandaloneCleaningCard";
import AddStandaloneCleaningDialog from "@/components/AddStandaloneCleaningDialog";
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

const STAFF_FILTERS = {
  all: '👥 Alle Putzkräfte',
  assigned: '✅ Zugewiesen',
  unassigned: '❌ Nicht zugewiesen'
};

const TIME_FILTERS = {
  all: '🕐 Alle Zeiten',
  week: '📅 n. Woche', 
  month: '🗓️ n. Monat',
  '3months': '📆 n. 3 Monate',
};

const CleaningPortal = () => {
  const { notify } = useNotify();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');
  const [staffFilter, setStaffFilter] = useState<StaffFilter>('all');
  const [houseFilter, setHouseFilter] = useState<HouseFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all');
  const [serviceProviders, setServiceProviders] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [editingTask, setEditingTask] = useState<TaskEditingState | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Booking card configuration
  const { config: cardConfig, updateConfig: updateCardConfig, loading: configLoading } = useBookingCardConfig();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch service providers
  useEffect(() => {
    const fetchProviders = async () => {
      const { data } = await supabase
        .from('service_providers')
        .select('id, name')
        .eq('service_type', 'cleaning')
        .order('name');
      if (data) setServiceProviders(data);
    };
    fetchProviders();
  }, []);

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

  const { 
    houses = [], 
    loading: housesLoading 
  } = useHouses();

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
    providerFilter
  );

  const totalCleaningTasks = hookTotalCleaningTasks;

  const handleStatusUpdate = useCallback(async (taskId: string, newStatus: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed') => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({ 
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
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

  const handleDateTimeUpdateFromCard = useCallback((taskId: string, date: string, time: string) => {
    // Find task from combined entries
    let task = null;
    for (const entry of combinedEntries) {
      if (entry.type === 'booking') {
        task = entry.data.service_tasks?.find(t => t.id === taskId);
      } else if (entry.data.id === taskId) {
        task = entry.data;
      }
      if (task) break;
    }
    
    if (task) {
      setEditingTask({
        id: taskId,
        scheduled_date: date,
        scheduled_time: time,
        status: task.status
      });
      setSelectedDate(new Date(date));
      setSelectedTime(time);
      handleDateTimeUpdate();
    }
  }, [combinedEntries, handleDateTimeUpdate]);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Amela Reinigungsportal</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <AddStandaloneCleaningDialog
                houses={houses}
                staff={staff}
                onSuccess={refetchBookings}
              />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden sm:flex space-x-6">
            <Link to="/">
              <Button variant="default" size="sm" className="my-2 hover-scale">
                🏠 Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                📅 Kalender
              </Button>
            </Link>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                👥 Putzkräfte
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="my-2 hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              🔔 Benachrichtigungen
            </Button>
          </div>
          
          {/* Mobile Navigation - 2x2 Grid */}
          <div className="sm:hidden grid grid-cols-2 gap-2 py-2">
            <Link to="/">
              <Button variant="default" size="sm" className="w-full justify-start hover-scale">
                🏠 Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="w-full justify-start hover-scale">
                📅 Kalender
              </Button>
            </Link>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="w-full justify-start hover-scale">
                👥 Putzkräfte
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              🔔 Benachrichtigungen
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Search and Filters Toggle */}
          <Card className="shadow-sm border border-border">
            <CardContent className="p-4">
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full flex items-center justify-between text-left hover:bg-muted/50 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">🔍 Such & Filter</span>
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
                    <span className="font-medium text-foreground">🔍 Suche</span>
                  </div>
                  
                  <div className="relative">
                    <Input
                      placeholder="Nach Gast, Haus oder Adresse suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">🔧 Filter</span>
                  </div>

                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
                    <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_FILTERS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={staffFilter} onValueChange={(value: StaffFilter) => setStaffFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Putzkräfte" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STAFF_FILTERS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={houseFilter} onValueChange={(value: HouseFilter) => setHouseFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Häuser" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Häuser</SelectItem>
                        {houses.map((house) => (
                          <SelectItem key={house.id} value={house.id}>{house.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Alle Zeiten" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(TIME_FILTERS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={providerFilter} onValueChange={(value: ProviderFilter) => setProviderFilter(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Dienstleister" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">🏢 Alle Dienstleister</SelectItem>
                        <SelectItem value="unassigned">❌ Nicht zugewiesen</SelectItem>
                        {serviceProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-center items-center pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      {currentFilteredEntries.length} von {totalCleaningTasks} Aufträgen
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking and Standalone Cleaning Cards */}
          <div className="space-y-4">
            {currentFilteredEntries.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Kein Reinigungsauftrag gefunden. Versuchen Sie andere Filter.
                  </p>
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
      </div>
    </div>
    </PullToRefresh>
  );
};

export default CleaningPortal;