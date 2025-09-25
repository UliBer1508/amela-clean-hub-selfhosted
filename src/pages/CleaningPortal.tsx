import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Search, Filter, Calendar, Users, Home, MapPin, Clock, User, CalendarIcon } from 'lucide-react';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  status: string;
  house_id: string;
  houses?: {
    name: string;
    address: string;
  };
  service_tasks?: Array<{
    id: string;
    service_type: string;
    scheduled_date: string;
    scheduled_time: string;
    status: string;
    assigned_staff_id: string;
    provider_id: string;
    service_providers?: {
      name: string;
    };
  }>;
}

const CleaningPortal = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  useEffect(() => {
    console.log('CleaningPortal: Component mounted, fetching data...');
    fetchBookingsWithCleaningTasks();
  }, []);

  const updateTaskDateTime = async (taskId: string, newDate: Date, newTime: string) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          scheduled_date: format(newDate, 'yyyy-MM-dd'),
          scheduled_time: newTime
        })
        .eq('id', taskId);

      if (error) throw error;
      
      // Refresh bookings
      await fetchBookingsWithCleaningTasks();
      setEditingTask(null);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleEditDateTime = (task: any) => {
    setEditingTask(task);
    setSelectedDate(new Date(task.scheduled_date));
    setSelectedTime(task.scheduled_time || '09:00');
  };

  const fetchBookingsWithCleaningTasks = async () => {
    console.log('CleaningPortal: Starting to fetch bookings...');
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_name,
          guest_email,
          check_in,
          check_out,
          number_of_guests,
          status,
          house_id,
          houses (
            name,
            address
          ),
          service_tasks!inner (
            id,
            service_type,
            scheduled_date,
            scheduled_time,
            status,
            assigned_staff_id,
            provider_id,
            service_providers (
              name
            )
          )
        `)
        .eq('service_tasks.service_type', 'cleaning');

      if (error) throw error;
      
      // Filter only bookings that have cleaning tasks
      const bookingsWithCleaning = data?.filter(booking => 
        booking.service_tasks && booking.service_tasks.length > 0
      ) || [];
      
      // Sort by earliest cleaning date first
      bookingsWithCleaning.sort((a, b) => {
        const aDate = a.service_tasks?.[0]?.scheduled_date;
        const bDate = b.service_tasks?.[0]?.scheduled_date;
        if (!aDate || !bDate) return 0;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });
      
      setBookings(bookingsWithCleaning);
      console.log('CleaningPortal: Successfully loaded', bookingsWithCleaning.length, 'bookings');
    } catch (error) {
      console.error('CleaningPortal: Error fetching bookings:', error);
    } finally {
      console.log('CleaningPortal: Loading finished, setting loading to false');
      setLoading(false);
    }
  };

  const isWithinTimeFilter = (date: string) => {
    if (timeFilter === 'all') return true;
    
    const taskDate = new Date(date);
    const now = new Date();
    
    switch (timeFilter) {
      case 'today':
        return taskDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return taskDate >= weekAgo && taskDate <= now;
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return taskDate >= monthAgo && taskDate <= now;
      case '3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        return taskDate >= threeMonthsAgo && taskDate <= now;
      case '6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        return taskDate >= sixMonthsAgo && taskDate <= now;
      case '12months':
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
        return taskDate >= twelveMonthsAgo && taskDate <= now;
      default:
        return true;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.houses?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.houses?.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      booking.service_tasks?.some(task => task.status === statusFilter);
    
    const matchesTime = timeFilter === 'all' || 
      booking.service_tasks?.some(task => isWithinTimeFilter(task.scheduled_date));
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    if (timeString) {
      return `${dateStr} - ${timeString.slice(0, 5)} Uhr`;
    }
    return dateStr;
  };

  const totalCleaningTasks = bookings.reduce((total, booking) => 
    total + (booking.service_tasks?.length || 0), 0
  );

  console.log('CleaningPortal: Rendering with', bookings.length, 'bookings, loading:', loading);
  console.log('CleaningPortal: Filtered bookings:', filteredBookings.length);
  console.log('CleaningPortal: About to render main content');

  if (loading) {
    console.log('CleaningPortal: Still loading...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Lade Reinigungsaufträge...</p>
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
            <Button variant="outline" size="sm">
              Reinigungsservice
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            <Button variant="default" size="sm" className="my-2">
              <Home className="w-4 h-4 mr-2" />
              Reinigungen ({totalCleaningTasks})    
            </Button>
            <Button variant="ghost" size="sm" className="my-2">
              <Calendar className="w-4 h-4 mr-2" />
              Kalender
            </Button>
            <Button variant="ghost" size="sm" className="my-2">
              <Users className="w-4 h-4 mr-2" />
              Putzkräfte
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Alle Buchungen mit Reinigungsaufträgen
          </h2>
          <p className="text-muted-foreground">
            Verwalten Sie alle Reinigungsaufträge für Ihre Gäste
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Suche & Filter</span>
                <Badge variant="secondary" className="ml-2">0 aktiv</Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Suche nach Gast, Haus oder Adresse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Filter</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="scheduled">Geplant</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                    <SelectItem value="cancelled">Storniert</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={staffFilter} onValueChange={setStaffFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Putzkräfte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Putzkräfte</SelectItem>
                    <SelectItem value="amela">Amela</SelectItem>
                    <SelectItem value="tatort">Tatort Reiniger</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Zeiten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Zeiten</SelectItem>
                    <SelectItem value="today">Heute</SelectItem>
                    <SelectItem value="week">Diese Woche</SelectItem>
                    <SelectItem value="month">Dieser Monat</SelectItem>
                    <SelectItem value="3months">Letzten 3 Monate</SelectItem>
                    <SelectItem value="6months">Letzten 6 Monate</SelectItem>
                    <SelectItem value="12months">Letzten 12 Monate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {filteredBookings.length} von {totalCleaningTasks} Aufträgen
                </span>
                <Button variant="outline" size="sm">
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Cards */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Home className="w-5 h-5 text-amber-600" />
                      <span className="font-semibold text-foreground">
                        Unterkunft: {booking.houses?.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Adresse: {booking.houses?.address}
                    </span>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Guest Information */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Gast: {booking.guest_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Gäste: {booking.number_of_guests} Personen</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Check-in: {formatDate(booking.check_in)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Check-out: {formatDate(booking.check_out)}</span>
                    </div>
                  </div>

                  {/* Cleaning Information */}
                  <div className="space-y-3">
                    {booking.service_tasks?.map((task) => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                          <span className="text-sm font-medium">Reinigung:</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Home className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">Provider: {task.service_providers?.name || 'Amela'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-red-600" />
                          <span className="text-sm">
                            Geplant: {formatDateTime(task.scheduled_date, task.scheduled_time)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                          <span className="text-sm">Putzkraft:</span>
                          <Select defaultValue="none">
                            <SelectTrigger className="h-8 w-[180px]">
                              <SelectValue placeholder="keine zugewiesen" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">keine zugewiesen</SelectItem>
                              <SelectItem value="amela">Amela</SelectItem>
                              <SelectItem value="tatort">Tatort Reiniger</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {task.assigned_staff_id && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
                            <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                              ✓ Zugewiesen an: {task.service_providers?.name || 'Amela'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border p-4 bg-muted/50">
                  <div className="flex justify-center space-x-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditDateTime(booking.service_tasks?.[0])}
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Datum/Uhrzeit bearbeiten
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Reinigungstermin bearbeiten</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Datum auswählen</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {selectedDate ? format(selectedDate, "dd.MM.yyyy") : "Datum wählen"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          
                          <div>
                            <Label>Uhrzeit</Label>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="08:00">08:00 Uhr</SelectItem>
                                <SelectItem value="09:00">09:00 Uhr</SelectItem>
                                <SelectItem value="10:00">10:00 Uhr</SelectItem>
                                <SelectItem value="11:00">11:00 Uhr</SelectItem>
                                <SelectItem value="12:00">12:00 Uhr</SelectItem>
                                <SelectItem value="13:00">13:00 Uhr</SelectItem>
                                <SelectItem value="14:00">14:00 Uhr</SelectItem>
                                <SelectItem value="15:00">15:00 Uhr</SelectItem>
                                <SelectItem value="16:00">16:00 Uhr</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => {
                                if (editingTask && selectedDate) {
                                  updateTaskDateTime(editingTask.id, selectedDate, selectedTime);
                                }
                              }}
                              className="flex-1"
                            >
                              Speichern
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-2" />
                      Reinigungsnotizen anzeigen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBookings.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Keine Reinigungsaufträge gefunden
              </h3>
              <p className="text-muted-foreground">
                Es wurden keine Buchungen mit Reinigungsaufträgen gefunden, die Ihren Suchkriterien entsprechen.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CleaningPortal;