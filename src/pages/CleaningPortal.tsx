import React, { useState, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import { useCleaningStaff } from '@/hooks/useCleaningStaff';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/utils/date';
import PWAInstallButton from '@/components/PWAInstallButton';
import NotificationSettings from '@/components/NotificationSettings';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BookingCardSettings, { useBookingCardConfig } from "@/components/BookingCardSettings";
import ConfigurableBookingCard from "@/components/ConfigurableBookingCard";
import {
  Home,
  Search,
  Filter,
  Bell,
  Calendar,
  Users,
  ArrowLeft,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

type StatusFilter = 'all' | 'scheduled' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
type StaffFilter = 'all' | 'assigned' | 'unassigned';
type HouseFilter = 'all' | string;
type TimeFilter = 'all' | 'week' | 'month' | '3months';

interface TaskEditingState {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
}

const STATUS_FILTERS = {
  all: 'Alle Status',
  scheduled: 'Geplant',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen', 
  delayed: 'Verzögert',
  cancelled: 'Storniert'
};

const STAFF_FILTERS = {
  all: 'Alle Putzkräfte',
  assigned: 'Zugewiesen',
  unassigned: 'Nicht zugewiesen'
};

const TIME_FILTERS = {
  all: 'Alle Zeiten',
  week: 'n. Woche', 
  month: 'n. Monat',
  '3months': 'n. 3 Monate',
};

const CleaningPortal = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');
  const [staffFilter, setStaffFilter] = useState<StaffFilter>('all');
  const [houseFilter, setHouseFilter] = useState<HouseFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [editingTask, setEditingTask] = useState<TaskEditingState | null>(null);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  // Booking card configuration
  const { config: cardConfig, updateConfig: updateCardConfig } = useBookingCardConfig();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { 
    bookings = [], 
    loading: bookingsLoading, 
    error: bookingsError,
    refetch: refetchBookings 
  } = useBookings();

  const { 
    houses = [], 
    loading: housesLoading 
  } = useHouses();

  const { 
    staff = [], 
    loading: staffLoading 
  } = useCleaningStaff();

  const bookingsWithTasks = bookings.filter(booking => 
    booking.service_tasks && booking.service_tasks.length > 0
  );

  const totalCleaningTasks = bookingsWithTasks.reduce((total, booking) => 
    total + (booking.service_tasks?.length || 0), 0
  );

  const filteredBookings = bookingsWithTasks.filter(booking => {
    const matchesSearch = debouncedSearchTerm === '' || 
      booking.guest_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      booking.houses?.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      booking.houses?.address.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    const matchesHouse = houseFilter === 'all' || booking.house_id === houseFilter;

    const hasMatchingTask = booking.service_tasks?.some(task => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      
      const matchesStaff = staffFilter === 'all' || 
        (staffFilter === 'assigned' && task.assigned_staff_id) ||
        (staffFilter === 'unassigned' && !task.assigned_staff_id);

      let matchesTime = true;
      if (timeFilter !== 'all') {
        const taskDate = new Date(task.scheduled_date);
        const today = new Date();
        
        switch (timeFilter) {
          case 'week':
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            matchesTime = taskDate >= today && taskDate <= nextWeek;
            break;
          case 'month':
            const nextMonth = new Date(today);
            nextMonth.setMonth(today.getMonth() + 1);
            matchesTime = taskDate >= today && taskDate <= nextMonth;
            break;
          case '3months':
            const next3Months = new Date(today);
            next3Months.setMonth(today.getMonth() + 3);
            matchesTime = taskDate >= today && taskDate <= next3Months;
            break;
        }
      }

      return matchesStatus && matchesStaff && matchesTime;
    });

    return matchesSearch && matchesHouse && hasMatchingTask;
  });

  const currentFilteredBookings = filteredBookings;

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

      toast({
        title: "Status aktualisiert",
        description: `Der Status wurde erfolgreich auf "${STATUS_FILTERS[newStatus as StatusFilter]}" geändert.`,
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  }, [toast, refetchBookings]);

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
      
      toast({
        title: "Zuweisung aktualisiert",
        description: `Die Aufgabe wurde ${staffName} zugewiesen.`,
      });

      refetchBookings();
    } catch (error) {
      console.error('Error updating staff assignment:', error);
      toast({
        title: "Fehler",
        description: "Zuweisung konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  }, [toast, refetchBookings, staff]);

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

      toast({
        title: "Termin aktualisiert",
        description: `Der Termin wurde erfolgreich aktualisiert.`,
      });

      refetchBookings();
      setEditingTask(null);
      setSelectedDate(undefined);
      setSelectedTime('');
    } catch (error) {
      console.error('Error updating task datetime:', error);
      toast({
        title: "Fehler",
        description: "Termin konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  }, [editingTask, selectedDate, selectedTime, toast, refetchBookings]);

  const handleDateTimeUpdateFromCard = useCallback((taskId: string, date: string, time: string) => {
    const task = bookingsWithTasks
      .flatMap(b => b.service_tasks || [])
      .find(t => t.id === taskId);
    
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
  }, [bookingsWithTasks, handleDateTimeUpdate]);

  if (bookingsLoading || housesLoading || staffLoading) {
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

  return (
    <div className="min-h-screen bg-background">
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
                <p className="text-sm text-muted-foreground">Professioneller Reinigungsservice für Ferienhäuser</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookingCardSettings 
                config={cardConfig}
                onConfigChange={updateCardConfig}
              />
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
                <Home className="w-4 h-4 mr-2" />
                Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                <Calendar className="w-4 h-4 mr-2" />
                Kalender
              </Button>
            </Link>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                <Users className="w-4 h-4 mr-2" />
                Putzkräfte
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="my-2 hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen
            </Button>
          </div>
          
          {/* Mobile Navigation - 2x2 Grid */}
          <div className="sm:hidden grid grid-cols-2 gap-2 py-2">
            <Link to="/">
              <Button variant="default" size="sm" className="w-full justify-start hover-scale">
                <Home className="w-4 h-4 mr-2" />
                Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Link to="/calendar">
              <Button variant="ghost" size="sm" className="w-full justify-start hover-scale">
                <Calendar className="w-4 h-4 mr-2" />
                Kalender
              </Button>
            </Link>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="w-full justify-start hover-scale">
                <Users className="w-4 h-4 mr-2" />
                Putzkräfte
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen
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
          {/* Search and Filters */}
          <Card className="shadow-sm border border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">Suche</span>
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
                  <span className="font-medium text-foreground">Filter</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                </div>

                <div className="flex justify-center items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {currentFilteredBookings.length} von {totalCleaningTasks} Aufträgen
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Cards */}
          <div className="space-y-4">
            {currentFilteredBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">
                    Keine Reinigungsaufträge gefunden. Versuchen Sie andere Filter.
                  </p>
                </CardContent>
              </Card>
            ) : (
              currentFilteredBookings.map((booking) => (
                <ConfigurableBookingCard
                  key={booking.id}
                  booking={booking}
                  config={cardConfig}
                  staff={staff}
                  onStatusUpdate={handleStatusUpdate}
                  onStaffUpdate={handleStaffUpdate}
                  onDateTimeUpdate={handleDateTimeUpdateFromCard}
                  formatDateTime={formatDateTime}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CleaningPortal;