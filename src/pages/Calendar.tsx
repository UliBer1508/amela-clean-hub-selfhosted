import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Home, Calendar as CalendarIcon, Users, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import PWAInstallButton from '@/components/PWAInstallButton';
import { formatGermanDate } from '@/utils/date';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

type ViewType = 'month' | 'week';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedHouse, setSelectedHouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { bookings, loading, totalCleaningTasks } = useBookings();
  const { houses } = useHouses();

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Filter bookings and tasks for current month
  const monthEvents = useMemo(() => {
    if (!bookings) return [];

    const events: Array<{
      id: string;
      date: Date;
      type: 'checkin' | 'checkout' | 'cleaning' | 'occupied';
      title: string;
      house: string;
      status?: string;
      guestName?: string;
      bookingId?: string;
    }> = [];

    bookings.forEach(booking => {
      const checkinDate = new Date(booking.check_in);
      const checkoutDate = new Date(booking.check_out);
      
      // Add check-in event
      events.push({
        id: `checkin-${booking.id}`,
        date: checkinDate,
        type: 'checkin',
        title: `Check-in: ${booking.guest_name}`,
        house: booking.houses?.name || 'Unbekannt',
        guestName: booking.guest_name,
        bookingId: booking.id
      });

      // Add check-out event
      events.push({
        id: `checkout-${booking.id}`,
        date: checkoutDate,
        type: 'checkout',
        title: `Check-out: ${booking.guest_name}`,
        house: booking.houses?.name || 'Unbekannt',
        guestName: booking.guest_name,
        bookingId: booking.id
      });

      // Add cleaning tasks
      booking.service_tasks?.forEach(task => {
        if (task.service_type === 'cleaning') {
          events.push({
            id: `cleaning-${task.id}`,
            date: new Date(task.scheduled_date),
            type: 'cleaning',
            title: `Reinigung: ${booking.houses?.name}`,
            house: booking.houses?.name || 'Unbekannt',
            status: task.status,
            guestName: booking.guest_name,
            bookingId: booking.id
          });
        }
      });
    });

    return events;
  }, [bookings]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return monthEvents.filter(event => isSameDay(event.date, selectedDate));
  }, [monthEvents, selectedDate]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'checkin': return 'bg-green-500';
      case 'checkout': return 'bg-red-500';
      case 'occupied': return 'bg-orange-500';
      case 'cleaning': return 'bg-blue-500';
      case 'laundry': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getDayEvents = (day: Date) => {
    return monthEvents.filter(event => isSameDay(event.date, day));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const previousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

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
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                <Home className="w-4 h-4 mr-2" />
                Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Button variant="default" size="sm" className="my-2">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Kalender
            </Button>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                <Users className="w-4 h-4 mr-2" />
                Putzkräfte
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="my-2 hover-scale">
              <Bell className="w-4 h-4 mr-2" />
              Benachrichtigungen
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">
              {format(currentDate, 'MMMM yyyy', { locale: de })}
            </h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Heute
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={viewType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('month')}
            >
              Monat
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              Woche
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {format(currentDate, 'MMMM yyyy', { locale: de })}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={previousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Week days header */}
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {calendarDays.map((day, index) => {
                    const dayEvents = getDayEvents(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={index}
                        className={`
                          min-h-[100px] p-2 border border-border cursor-pointer transition-colors
                          ${!isCurrentMonth ? 'bg-muted/50 text-muted-foreground' : ''}
                          ${isTodayDate ? 'bg-primary/10' : ''}
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          hover:bg-accent
                        `}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="text-sm font-medium mb-1">
                          {format(day, 'd')}
                        </div>
                        
                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event, eventIndex) => (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded text-white ${getEventColor(event.type)} truncate`}
                              title={event.title}
                            >
                              {event.type === 'checkin' && '✓ Check-in'}
                              {event.type === 'checkout' && '✗ Check-out'}
                              {event.type === 'cleaning' && '🧽 Reinigung'}
                              {event.type === 'occupied' && '🏠 Belegt'}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - 2} mehr
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">
                  {selectedDate 
                    ? `Termine für ${format(selectedDate, 'd. MMMM', { locale: de })}`
                    : 'Datum auswählen'
                  }
                </h3>
                
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateEvents.map(event => (
                        <div key={event.id} className="p-2 rounded border">
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs text-muted-foreground">{event.house}</div>
                          {event.status && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {event.status}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Keine Termine für diesen Tag
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Wählen Sie ein Datum aus dem Kalender
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Legende</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span className="text-sm">Check-in</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span className="text-sm">Check-out</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span className="text-sm">Belegt</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span className="text-sm">Reinigung</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span className="text-sm">Wäsche</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Calendar;