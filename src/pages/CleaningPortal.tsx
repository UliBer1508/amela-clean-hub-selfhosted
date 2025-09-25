import React, { useState, useCallback, useMemo } from 'react';
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
import { Search, Filter, Calendar, Users, Home, MapPin, Clock, User, CalendarIcon, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { useBookings } from '@/hooks/useBookings';
import NotificationSettings from '@/components/NotificationSettings';
import { StatusFilter, TimeFilter, TaskEditingState } from '@/types/booking';
import { APP_CONFIG, STATUS_FILTERS, TIME_FILTERS } from '@/constants/app';
import { formatDateTime } from '@/utils/date';
import { validateTime, sanitizeSearchTerm } from '@/utils/validation';

const CleaningPortal = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('scheduled');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [editingTask, setEditingTask] = useState<TaskEditingState | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>(APP_CONFIG.DEFAULT_TIME);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, APP_CONFIG.SEARCH_DEBOUNCE_MS);
  const { toast } = useToast();
  
  const {
    bookings,
    loading,
    error,
    totalCleaningTasks,
    updateTaskStatus,
    updateTaskDateTime,
    filteredBookings,
    refetch
  } = useBookings();

  const handleStatusUpdate = useCallback(async (
    taskId: string, 
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed'
  ) => {
    const result = await updateTaskStatus(taskId, newStatus);
    
    if (result.success) {
      toast({
        title: "Status aktualisiert",
        description: `Aufgabe wurde erfolgreich auf "${STATUS_FILTERS[newStatus]}" gesetzt.`,
      });
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Status konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  }, [updateTaskStatus, toast]);

  const handleEditDateTime = useCallback((task: TaskEditingState) => {
    setEditingTask(task);
    setSelectedDate(new Date(task.scheduled_date));
    setSelectedTime(task.scheduled_time || APP_CONFIG.DEFAULT_TIME);
  }, []);

  const handleDateTimeUpdate = useCallback(async () => {
    if (!editingTask || !selectedDate) return;

    const timeValidation = validateTime(selectedTime);
    if (!timeValidation.isValid) {
      toast({
        title: "Ungültige Zeit",
        description: timeValidation.error,
        variant: "destructive",
      });
      return;
    }

    const result = await updateTaskDateTime(editingTask.id, selectedDate, selectedTime);
    
    if (result.success) {
      toast({
        title: "Termin aktualisiert",
        description: "Der Reinigungstermin wurde erfolgreich geändert.",
      });
      setEditingTask(null);
    } else {
      toast({
        title: "Fehler",
        description: result.error || "Termin konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    }
  }, [editingTask, selectedDate, selectedTime, updateTaskDateTime, toast]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('scheduled');
    setTimeFilter('all');
  }, []);

  const currentFilteredBookings = useMemo(() => 
    filteredBookings(debouncedSearchTerm, statusFilter, timeFilter), 
    [filteredBookings, debouncedSearchTerm, statusFilter, timeFilter]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearchTerm.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (timeFilter !== 'all') count++;
    return count;
  }, [debouncedSearchTerm, statusFilter, timeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Lade Reinigungsaufträge...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
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
            <Button variant="outline" size="sm" className="hover-scale">
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
            <Button variant="ghost" size="sm" className="my-2 hover-scale">
              <Calendar className="w-4 h-4 mr-2" />
              Kalender
            </Button>
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
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showNotificationSettings ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">
                Benachrichtigungseinstellungen
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setShowNotificationSettings(false)}
                className="hover-scale"
              >
                Zurück zu Reinigungen
              </Button>
            </div>
            <NotificationSettings />
          </div>
        ) : (
          <div className="animate-fade-in">
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
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount} aktiv
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Suche nach Gast, Haus oder Adresse..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(sanitizeSearchTerm(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Filter</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                    <Button 
                      variant="outline" 
                      onClick={handleResetFilters}
                      disabled={activeFilterCount === 0}
                      className="hover-scale"
                    >
                      Filter zurücksetzen
                    </Button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border">
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
                  <Card key={booking.id} className="overflow-hidden hover-scale">
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
                            <span className="text-sm">Check-in: {formatDateTime(booking.check_in)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Check-out: {formatDateTime(booking.check_out)}</span>
                          </div>
                        </div>

                        {/* Cleaning Tasks */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-foreground">Reinigungsaufträge</h4>
                          {booking.service_tasks?.map((task) => (
                            <div key={task.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Reinigung</span>
                                <Badge variant={
                                  task.status === 'completed' ? 'default' : 
                                  task.status === 'cancelled' ? 'destructive' : 
                                  'secondary'
                                }>
                                  {STATUS_FILTERS[task.status as StatusFilter]}
                                </Badge>
                              </div>

                              <div className="flex items-center space-x-2 text-sm">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span>{formatDateTime(task.scheduled_date, task.scheduled_time)}</span>
                              </div>

                              {task.service_providers?.name && (
                                <div className="text-sm text-muted-foreground">
                                  Zugewiesen an: {task.service_providers.name}
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-2">
                                <Select
                                  value={task.status}
                                  onValueChange={(value: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed') => 
                                    handleStatusUpdate(task.id, value)
                                  }
                                >
                                  <SelectTrigger className="w-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="scheduled">Geplant</SelectItem>
                                    <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                                    <SelectItem value="delayed">Verzögert</SelectItem>
                                    <SelectItem value="cancelled">Storniert</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditDateTime({
                                        id: task.id,
                                        scheduled_date: task.scheduled_date,
                                        scheduled_time: task.scheduled_time,
                                        status: task.status
                                      })}
                                    >
                                      <CalendarIcon className="w-4 h-4 mr-1" />
                                      Termin ändern
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reinigungstermin ändern</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label>Datum</Label>
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
                                              disabled={(date) => date < new Date()}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                      <div>
                                        <Label htmlFor="time">Uhrzeit</Label>
                                        <Input
                                          id="time"
                                          type="time"
                                          value={selectedTime}
                                          onChange={(e) => setSelectedTime(e.target.value)}
                                        />
                                      </div>
                                      <Button 
                                        onClick={handleDateTimeUpdate}
                                        disabled={!selectedDate}
                                        className="w-full hover-scale"
                                      >
                                        Termin aktualisieren
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CleaningPortal;