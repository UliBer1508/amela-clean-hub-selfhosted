import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalendarEvent {
  id: string;
  date: string;
  type: 'check-in' | 'check-out' | 'cleaning' | 'laundry';
  title: string;
  time?: string;
  guest_name?: string;
  house_name?: string;
}

const CalendarView = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentMonth]);

  const fetchCalendarEvents = async () => {
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Fetch bookings for check-ins and check-outs
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          guest_name,
          check_in,
          check_out,
          houses (name)
        `)
        .or(`check_in.gte.${format(monthStart, 'yyyy-MM-dd')},check_out.gte.${format(monthStart, 'yyyy-MM-dd')}`)
        .lte('check_in', format(monthEnd, 'yyyy-MM-dd'));

      // Fetch service tasks for cleaning and laundry
      const { data: tasksData, error: tasksError } = await supabase
        .from('service_tasks')
        .select(`
          id,
          service_type,
          scheduled_date,
          scheduled_time,
          bookings (
            guest_name,
            houses (name)
          )
        `)
        .gte('scheduled_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(monthEnd, 'yyyy-MM-dd'));

      if (bookingsError) throw bookingsError;
      if (tasksError) throw tasksError;

      const calendarEvents: CalendarEvent[] = [];

      // Add check-in/check-out events
      bookingsData?.forEach(booking => {
        calendarEvents.push(
          {
            id: `checkin-${booking.id}`,
            date: booking.check_in,
            type: 'check-in',
            title: 'Check-in',
            guest_name: booking.guest_name,
            house_name: booking.houses?.name
          },
          {
            id: `checkout-${booking.id}`,
            date: booking.check_out,
            type: 'check-out',
            title: 'Check-out',
            guest_name: booking.guest_name,
            house_name: booking.houses?.name
          }
        );
      });

      // Add service task events
      tasksData?.forEach(task => {
        calendarEvents.push({
          id: `task-${task.id}`,
          date: task.scheduled_date,
          type: task.service_type as 'cleaning' | 'laundry',
          title: task.service_type === 'cleaning' ? 'Reinigung' : 'Wäsche',
          time: task.scheduled_time,
          guest_name: task.bookings?.guest_name,
          house_name: task.bookings?.houses?.name
        });
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayEvents = (date: Date) => {
    return events.filter(event => 
      isSameDay(new Date(event.date), date)
    );
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'check-in':
        return 'bg-green-500';
      case 'check-out':
        return 'bg-red-500';
      case 'cleaning':
        return 'bg-blue-500';
      case 'laundry':
        return 'bg-purple-500';
      default:
        return 'bg-orange-500';
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const selectedDateEvents = getDayEvents(selectedDate);

  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground">Kalender</h1>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-lg font-medium min-w-[200px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Heute
              </Button>
              <Button 
                variant={view === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setView('month')}
              >
                Monat
              </Button>
              <Button 
                variant={view === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setView('week')}
              >
                Woche
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekdays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, dayIdx) => {
                    const dayEvents = getDayEvents(day);
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          aspect-square p-1 text-sm border rounded-md relative hover:bg-muted/50
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${isToday && !isSelected ? 'bg-accent text-accent-foreground' : ''}
                        `}
                      >
                        <div className="font-medium">
                          {format(day, 'd')}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1 right-1">
                            <div className="flex gap-1 flex-wrap">
                              {dayEvents.slice(0, 3).map((event, idx) => (
                                <div
                                  key={idx}
                                  className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                                  title={`${event.title} - ${event.guest_name || ''}`}
                                />
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-xs">+{dayEvents.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Events */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Termine für {format(selectedDate, 'd. MMMM')}
                </h3>
                {selectedDateEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Keine Termine für diesen Tag
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)} mt-1`} />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{event.title}</div>
                          {event.time && (
                            <div className="text-xs text-muted-foreground">
                              {event.time.slice(0, 5)} Uhr
                            </div>
                          )}
                          {event.guest_name && (
                            <div className="text-xs text-muted-foreground">
                              {event.guest_name}
                            </div>
                          )}
                          {event.house_name && (
                            <div className="text-xs text-muted-foreground">
                              {event.house_name}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Legende</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-green-500" />
                    <span className="text-sm">Check-in</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                    <span className="text-sm">Check-out</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-orange-500" />
                    <span className="text-sm">Belegt</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <span className="text-sm">Reinigung</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full bg-purple-500" />
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

export default CalendarView;