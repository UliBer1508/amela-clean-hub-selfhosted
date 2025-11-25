import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Home, Calendar as CalendarIcon, Users, Bell, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import PWAInstallButton from '@/components/PWAInstallButton';
import NotificationSettings from '@/components/NotificationSettings';
import BookingCardSettings, { useBookingCardConfig } from '@/components/BookingCardSettings';
import PullToRefresh from '@/components/PullToRefresh';
import { formatGermanDate } from '@/utils/date';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChatButton } from '@/components/PortalChat';
import { usePortalMessages } from '@/hooks/usePortalMessages';

type ViewType = 'month' | 'week';

interface CalendarProps {
  chatProps: {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
  };
}

const Calendar = ({ chatProps }: CalendarProps) => {
  const { unreadCount } = usePortalMessages();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedHouse, setSelectedHouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const { allBookings, loading, totalCleaningTasks, forceRefresh, lastRefresh } = useBookings();
  const { config: cardConfig, updateConfig: updateCardConfig, loading: configLoading } = useBookingCardConfig();
  const { houses } = useHouses();

  // Get calendar days for the current month/week
  const calendarDays = useMemo(() => {
    if (viewType === 'week') {
      // Week view: show 7 days of current week
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      // Month view: show full month calendar
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [currentDate, viewType]);

  // Filter bookings and tasks for current month
  const monthEvents = useMemo(() => {
    if (!allBookings) return [];

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

    allBookings.forEach(booking => {
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

      // Add occupied days (between check-in and check-out)
      const currentDate = new Date(checkinDate);
      currentDate.setDate(currentDate.getDate() + 1); // Start from day after check-in
      
      while (currentDate < checkoutDate) {
        events.push({
          id: `occupied-${booking.id}-${currentDate.toISOString().split('T')[0]}`,
          date: new Date(currentDate),
          type: 'occupied',
          title: `Belegt: ${booking.guest_name}`,
          house: booking.houses?.name || 'Unbekannt',
          guestName: booking.guest_name,
          bookingId: booking.id
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

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
  }, [allBookings]);

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

  const previousPeriod = () => {
    if (viewType === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => subMonths(prev, 1));
    }
  };

  const nextPeriod = () => {
    if (viewType === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => addMonths(prev, 1));
    }
  };

  const previousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const nextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const handleRefresh = async () => {
    await forceRefresh();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
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
              </div>
            </div>
              <div className="flex items-center space-x-2">
                <ChatButton onClick={() => chatProps.setIsChatOpen(true)} unreadCount={unreadCount} />
                <div className={cardConfig.showMobileSettingsButton ? '' : 'hidden lg:block'}>
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
              <Button variant="ghost" size="sm" className="my-2 hover-scale">
                🏠 Reinigungen ({totalCleaningTasks})
              </Button>
            </Link>
            <Button variant="default" size="sm" className="my-2">
              📅 Kalender
            </Button>
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
          
          {/* Mobile Navigation - Icon Only */}
          <div className="sm:hidden flex justify-around items-center gap-1 py-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center relative hover-scale">
                <Home className="w-6 h-6" />
                <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] text-[10px] px-1 bg-primary text-primary-foreground">
                  {totalCleaningTasks}
                </Badge>
              </Button>
            </Link>
            <Button variant="default" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center">
              <CalendarIcon className="w-6 h-6" />
            </Button>
            <Link to="/putzkraefte">
              <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] p-2 justify-center hover-scale">
                <Users className="w-6 h-6" />
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              className="min-h-[44px] min-w-[44px] p-2 justify-center hover-scale"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
            >
              <Bell className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showNotificationSettings ? (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h1 className="text-lg md:text-2xl font-bold">
                <span className="md:hidden">Benachrichtigungen</span>
                <span className="hidden md:inline">Benachrichtigungseinstellungen</span>
              </h1>
              <Button 
                variant="outline" 
                onClick={() => setShowNotificationSettings(false)}
                className="hover-scale"
              >
                Zurück zum Kalender
              </Button>
            </div>
            <NotificationSettings />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6 space-y-4">
              {/* Mobile Layout - Stack vertically */}
              <div className="sm:hidden space-y-3">
                <h1 className="text-2xl font-bold">
                  {viewType === 'week' 
                    ? `Woche vom ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`
                    : format(currentDate, 'MMMM yyyy', { locale: de })
                  }
                </h1>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={previousPeriod}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Heute
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextPeriod}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
              </div>

              {/* Desktop Layout - Single row */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold">
                    {viewType === 'week' 
                      ? `Woche vom ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`
                      : format(currentDate, 'MMMM yyyy', { locale: de })
                    }
                  </h1>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={previousPeriod}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Heute
                    </Button>
                    <Button variant="outline" size="sm" onClick={nextPeriod}>
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
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {viewType === 'week' 
                      ? `Woche vom ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`
                      : format(currentDate, 'MMMM yyyy', { locale: de })
                    }
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={previousPeriod}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextPeriod}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className={`grid gap-1 ${viewType === 'week' ? 'grid-cols-7' : 'grid-cols-7'}`}>
                  {/* Week days header */}
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {calendarDays.map((day, index) => {
                    const dayEvents = getDayEvents(day);
                    const isCurrentMonth = viewType === 'week' ? true : isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);

                    return (
                      <div
                        key={index}
                        className={`
                          ${viewType === 'week' ? 'min-h-[120px]' : 'min-h-[100px]'} p-2 border border-border cursor-pointer transition-colors
                          ${!isCurrentMonth ? 'bg-muted/50 text-muted-foreground' : ''}
                          ${isTodayDate ? 'bg-primary/10' : ''}
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          hover:bg-accent
                        `}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="text-sm font-medium mb-1">
                          {viewType === 'week' 
                            ? format(day, 'd. MMM', { locale: de })
                            : format(day, 'd')
                          }
                        </div>
                        
                        {/* Events */}
                        <div className="space-y-1">
                          {dayEvents.slice(0, viewType === 'week' ? 4 : 2).map((event, eventIndex) => (
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
                          {dayEvents.length > (viewType === 'week' ? 4 : 2) && (
                            <div className="text-xs text-muted-foreground">
                              +{dayEvents.length - (viewType === 'week' ? 4 : 2)} mehr
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
        </>
        )}
      </main>
    </div>
    </PullToRefresh>
  );
};

export default Calendar;