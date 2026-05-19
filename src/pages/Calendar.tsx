import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, Calendar as CalendarIcon, Users, Bell, RefreshCw, MessageCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { useAllBookings } from '@/hooks/useAllBookings';
import { useBookings } from '@/hooks/useBookings';
import { useHouses } from '@/hooks/useHouses';
import PWAInstallButton from '@/components/PWAInstallButton';
import PWAStatusBar from '@/components/PWAStatusBar';
import { usePWA } from '@/hooks/usePWA';

import ReminderSettingsPopover from '@/components/amela/ReminderSettingsPopover';
import BookingCardSettings, { useBookingCardConfig } from '@/components/BookingCardSettings';
import PullToRefresh from '@/components/PullToRefresh';
import { formatGermanDate } from '@/utils/date';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChatButton } from '@/components/PortalChat';
import { usePortalMessages } from '@/hooks/usePortalMessages';
import { cn } from '@/lib/utils';
import { getGuestName } from '@/lib/guestHelpers';
import { supabase } from '@/integrations/supabase/client';

type ViewType = 'month' | 'week' | 'gantt';

// Haus-Farben für visuelle Unterscheidung im Gantt-Chart
const HOUSE_COLORS = [
  { bg: 'bg-blue-500', text: 'text-white', hex: '#3b82f6' },
  { bg: 'bg-purple-500', text: 'text-white', hex: '#a855f7' },
  { bg: 'bg-emerald-500', text: 'text-white', hex: '#10b981' },
  { bg: 'bg-amber-500', text: 'text-white', hex: '#f59e0b' },
  { bg: 'bg-rose-500', text: 'text-white', hex: '#f43f5e' },
  { bg: 'bg-cyan-500', text: 'text-white', hex: '#06b6d4' },
  { bg: 'bg-indigo-500', text: 'text-white', hex: '#6366f1' },
  { bg: 'bg-pink-500', text: 'text-white', hex: '#ec4899' },
];

// Konsistente Farbzuweisung pro Haus (via Hash)
const getHouseColor = (houseId: string) => {
  if (!houseId) return HOUSE_COLORS[0];
  const hash = houseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return HOUSE_COLORS[hash % HOUSE_COLORS.length];
};

// Haus-Kürzel generieren (z.B. "Venedigersiedlung Chalet" → "VC")
const getHouseAbbreviation = (houseName: string): string => {
  if (!houseName) return '';
  const words = houseName.split(' ').filter(w => w.length > 0);
  if (words.length >= 2) {
    return words.map(w => w.charAt(0).toUpperCase()).join('');
  }
  return houseName.substring(0, 3).toUpperCase();
};

interface CalendarProps {
  chatProps: {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
  };
}

const Calendar = ({ chatProps }: CalendarProps) => {
  const { unreadCount } = usePortalMessages();
  const { isInstalled, isOnline } = usePWA();
  const pwaBarVisible = isInstalled || !isOnline;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('gantt');
  const [selectedHouse, setSelectedHouse] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showReminderPopup, setShowReminderPopup] = useState(false);

  const { allBookings, loading, forceRefresh } = useAllBookings();
  const { totalCleaningTasks } = useBookings();
  const { config: cardConfig, updateConfig: updateCardConfig } = useBookingCardConfig();
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

  // State für Wäsche-Aufträge
  const [laundryOrders, setLaundryOrders] = useState<any[]>([]);

  // Wäsche-Daten laden
  useEffect(() => {
    const fetchLaundryOrders = async () => {
      try {
        const { data, error } = await supabase
          .from('linen_orders')
          .select(`
            id, delivery_date, status,
            house_id,
            houses!linen_orders_house_id_fkey (id, name)
          `);
        if (!error && data) setLaundryOrders(data);
      } catch (e) {
        console.log('Linen orders not available');
      }
    };
    fetchLaundryOrders();
  }, []);

  // Filter bookings and tasks for current month
  const monthEvents = useMemo(() => {
    if (!allBookings) return [];

    const events: Array<{
      id: string;
      date: Date;
      type: 'checkin' | 'checkout' | 'cleaning' | 'occupied' | 'laundry-pickup' | 'laundry-delivery';
      title: string;
      house: string;
      house_id: string;
      status?: string;
      guestName?: string;
      bookingId?: string;
    }> = [];

    allBookings.forEach(booking => {
      // Stornierte Buchungen nicht anzeigen
      if (booking.status === 'cancelled') return;
      
      const checkinDate = new Date(booking.check_in);
      const checkoutDate = new Date(booking.check_out);
      const guestName = getGuestName(booking);
      
      // Add check-in event
      events.push({
        id: `checkin-${booking.id}`,
        date: checkinDate,
        type: 'checkin',
        title: `Check-in: ${guestName}`,
        house: booking.houses?.name || 'Unbekannt',
        house_id: booking.house_id,
        guestName: guestName,
        bookingId: booking.id
      });

      // Add check-out event
      events.push({
        id: `checkout-${booking.id}`,
        date: checkoutDate,
        type: 'checkout',
        title: `Check-out: ${guestName}`,
        house: booking.houses?.name || 'Unbekannt',
        house_id: booking.house_id,
        guestName: guestName,
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
          title: `Belegt: ${guestName}`,
          house: booking.houses?.name || 'Unbekannt',
          house_id: booking.house_id,
          guestName: guestName,
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
            house_id: booking.house_id,
            status: task.status,
            guestName: guestName,
            bookingId: booking.id
          });
        }
      });
    });

    // Wäsche-Events aus linen_orders hinzufügen
    laundryOrders.forEach(order => {
      const house = order.houses;
      if (order.delivery_date && house) {
        events.push({
          id: `laundry-delivery-${order.id}`,
          date: new Date(order.delivery_date),
          type: 'laundry-delivery',
          title: `Wäsche Lieferung: ${house.name}`,
          house: house.name,
          house_id: house.id,
          status: order.status
        });
      }
    });

     return events;
  }, [allBookings, laundryOrders]);

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
      case 'laundry-pickup': return 'bg-violet-400';
      case 'laundry-delivery': return 'bg-violet-600';
      default: return 'bg-gray-500';
    }
  };

  const getDayEvents = (day: Date) => {
    return monthEvents.filter(event => isSameDay(event.date, day));
  };

  // Gantt-Chart: Tage für aktuellen Monat
  const ganttDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate]);

  // Gantt-Chart: Buchungen nach Haus gruppieren
  const bookingsByHouse = useMemo(() => {
    const grouped = new Map<string, Array<{
      id: string;
      guest_name: string;
      check_in: Date;
      check_out: Date;
      house_id: string;
      house_name: string;
    }>>();
    
    allBookings.forEach(booking => {
      // Stornierte Buchungen nicht anzeigen
      if (booking.status === 'cancelled') return;
      
      const houseId = booking.house_id;
      const houseName = booking.houses?.name || 'Unbekannt';
      
      if (!grouped.has(houseId)) {
        grouped.set(houseId, []);
      }
      
      grouped.get(houseId)!.push({
        id: booking.id,
        guest_name: getGuestName(booking),
        check_in: new Date(booking.check_in),
        check_out: new Date(booking.check_out),
        house_id: houseId,
        house_name: houseName,
      });
    });
    
    return grouped;
  }, [allBookings]);

  // Gantt-Chart: Balken-Position berechnen (Mitte Check-in bis Mitte Check-out)
  const getGanttBarStyle = (checkIn: Date, checkOut: Date) => {
    const monthStart = startOfMonth(currentDate);
    const totalDays = ganttDays.length;
    const dayWidth = 100 / totalDays;
    
    // Check-in: Balken beginnt ab MITTE des Check-in-Tages
    const startDay = Math.max(0, differenceInDays(checkIn, monthStart));
    const left = (startDay * dayWidth) + (dayWidth / 2);
    
    // Check-out: Balken endet in der MITTE des Check-out-Tages
    const endDay = Math.min(totalDays, differenceInDays(checkOut, monthStart));
    const right = (endDay * dayWidth) + (dayWidth / 2);
    
    const width = Math.max(dayWidth, right - left);
    
    return { 
      left: `${Math.max(0, left)}%`, 
      width: `${Math.min(width, 100 - Math.max(0, left))}%` 
    };
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

  const calendarTitle = viewType === 'week'
    ? `Woche vom ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM', { locale: de })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd. MMM yyyy', { locale: de })}`
    : format(currentDate, 'MMMM yyyy', { locale: de });


  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const handleRefresh = async () => {
    await forceRefresh();
  };

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh} disabled={loading}>
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
              <div className={cardConfig.showMobileSettingsButton ? 'block' : 'hidden sm:block'}>
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

      {/* Erinnerungs-Einstellungen Popup */}
      <ReminderSettingsPopover open={showReminderPopup} onOpenChange={setShowReminderPopup} />



      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pt-1 pb-24 sm:px-6 lg:px-8 md:py-8 sm:pb-8">
        <>

            {/* Header */}
            <div className="mb-6 space-y-4">
              {/* Mobile Layout - Stack vertically */}
              <div className="sm:hidden space-y-3">
                <h1 className="text-2xl font-bold">{calendarTitle}</h1>
                
                {/* Zeile 1: Navigation - zentriert */}
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" onClick={previousPeriod} className="min-h-[44px] min-w-[44px] active:scale-95">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="outline" onClick={goToToday} className="min-h-[44px] px-5 active:scale-95">
                    Heute
                  </Button>
                  <Button variant="outline" onClick={nextPeriod} className="min-h-[44px] min-w-[44px] active:scale-95">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                
                {/* Zeile 2: Ansichtswahl - 3-Spalten-Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={viewType === 'month' ? 'default' : 'outline'}
                    onClick={() => setViewType('month')}
                    className="min-h-[44px] active:scale-95"
                  >
                    Monat
                  </Button>
                  <Button
                    variant={viewType === 'week' ? 'default' : 'outline'}
                    onClick={() => setViewType('week')}
                    className="min-h-[44px] active:scale-95"
                  >
                    Woche
                  </Button>
                  <Button
                    variant={viewType === 'gantt' ? 'default' : 'outline'}
                    onClick={() => setViewType('gantt')}
                    className="min-h-[44px] active:scale-95"
                  >
                    Gantt
                  </Button>
                </div>
              </div>

              {/* Desktop Layout - Single row */}
              <div className="hidden sm:flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold">{calendarTitle}</h1>
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
                  <Button
                    variant={viewType === 'gantt' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewType('gantt')}
                  >
                    Gantt
                  </Button>
                </div>
              </div>
            </div>

        <div className={cn("grid gap-6", viewType === 'gantt' ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-4")}>
          {/* Calendar / Gantt */}
          <div className={viewType === 'gantt' ? '' : 'lg:col-span-3'}>
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="hidden sm:block text-lg md:text-xl font-semibold">{calendarTitle}</h2>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="ghost" onClick={previousPeriod} className="h-11 w-11 p-0 active:scale-95">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" onClick={nextPeriod} className="h-11 w-11 p-0 active:scale-95">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Gantt Chart View */}
                {viewType === 'gantt' ? (
                  <ScrollArea className="w-full">
                    <div className="w-full">
                      {/* Header mit Tagen */}
                      <div className="flex border-b bg-muted/30">
                        <div className="w-20 sm:w-28 md:w-40 shrink-0 p-1 sm:p-2 border-r font-medium text-xs sm:text-sm">
                          Unterkunft
                        </div>
                        <div 
                          className="flex-1 grid" 
                          style={{ gridTemplateColumns: `repeat(${ganttDays.length}, minmax(32px, 1fr))` }}
                        >
                          {ganttDays.map((day) => (
                            <div
                              key={day.toISOString()}
                              className={cn(
                                "p-1 text-center text-xs border-r last:border-r-0",
                                isToday(day) && "bg-primary/20 font-bold",
                                (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/30"
                              )}
                            >
                              <div>{format(day, 'd')}</div>
                              <div className="text-muted-foreground text-[10px]">
                                {format(day, 'EEE', { locale: de })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Zeilen pro Haus */}
                      {houses.map((house) => {
                        const houseColor = getHouseColor(house.id);
                        const houseBookings = bookingsByHouse.get(house.id) || [];
                        
                        return (
                          <div key={house.id} className="flex border-b min-h-[44px] sm:min-h-[50px] md:min-h-[60px]">
                            {/* Linke Spalte: Haus-Name */}
                            <div className="w-20 sm:w-28 md:w-40 shrink-0 p-1 sm:p-2 border-r bg-muted/20 flex items-center">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <div className={cn("w-2 h-2 sm:w-3 sm:h-3 rounded-full shrink-0", houseColor.bg)} />
                                <span className="text-[10px] sm:text-xs md:text-sm font-medium truncate">{house.name}</span>
                              </div>
                            </div>

                            {/* Rechte Spalte: Timeline mit Balken */}
                            <div className="flex-1 relative">
                              {/* Hintergrund-Grid */}
                              <div 
                                className="absolute inset-0 grid" 
                                style={{ gridTemplateColumns: `repeat(${ganttDays.length}, minmax(32px, 1fr))` }}
                              >
                                {ganttDays.map((day) => (
                                  <div
                                    key={day.toISOString()}
                                    className={cn(
                                      "border-r last:border-r-0 h-full",
                                      isToday(day) && "bg-primary/10",
                                      (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/20"
                                    )}
                                  />
                                ))}
                              </div>

                              {/* Buchungsbalken */}
                              <div className="relative h-full py-2 px-1">
                                {houseBookings.map((booking) => {
                                  const style = getGanttBarStyle(booking.check_in, booking.check_out);
                                  return (
                                    <div
                                      key={booking.id}
                                      className={cn(
                                        "absolute top-1/2 -translate-y-1/2 h-7 md:h-8 rounded-md",
                                        "flex items-center px-1 md:px-2 cursor-pointer",
                                        "border border-white/40",
                                        houseColor.bg, houseColor.text
                                      )}
                                      style={{ 
                                        left: style.left, 
                                        width: `calc(${style.width} - 2px)`,
                                        minWidth: '24px' 
                                      }}
                                      title={`${booking.guest_name}\n${format(booking.check_in, 'd. MMM', { locale: de })} - ${format(booking.check_out, 'd. MMM', { locale: de })}`}
                                    >
                                      <span className="text-[10px] md:text-xs font-medium truncate">
                                        {booking.guest_name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Leere Nachricht wenn keine Häuser */}
                      {houses.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground">
                          Keine Unterkünfte gefunden
                        </div>
                      )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                ) : (
                  /* Month/Week Calendar Grid */
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
                          className={cn(
                            viewType === 'week' ? 'min-h-[120px]' : 'min-h-[88px] sm:min-h-[100px]',
                            'p-1.5 sm:p-2 border border-border cursor-pointer transition-colors rounded-sm',
                            !isCurrentMonth && 'bg-muted/50 text-muted-foreground',
                            isTodayDate && !isSelected && 'bg-primary/10',
                            isSelected && 'ring-2 ring-primary ring-inset',
                            'hover:bg-accent active:bg-accent'
                          )}
                          onClick={() => {
                            setSelectedDate(day);
                            setDayDetailOpen(true);
                          }}
                        >
                          <div className="text-sm font-medium mb-1">
                            {viewType === 'week' 
                              ? format(day, 'd. MMM', { locale: de })
                              : format(day, 'd')
                            }
                          </div>
                          
                          {/* Events */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, viewType === 'week' ? 4 : 3).map((event) => {
                              const houseColor = getHouseColor(event.house_id);
                              const abbr = getHouseAbbreviation(event.house);
                              return (
                                <div
                                  key={event.id}
                                  className={cn(
                                    "text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate",
                                    houseColor.bg, houseColor.text
                                  )}
                                  title={`${event.title} - ${event.house}`}
                                >
                                  {event.type === 'checkin' && `Check-in • ${abbr}`}
                                  {event.type === 'checkout' && `Check-out • ${abbr}`}
                                  {event.type === 'cleaning' && `Reinigung • ${abbr}`}
                                  {event.type === 'laundry-pickup' && `Wäsche • ${abbr}`}
                                  {event.type === 'laundry-delivery' && `Wäsche • ${abbr}`}
                                  {event.type === 'occupied' && event.house}
                                </div>
                              );
                            })}
                            {dayEvents.length > (viewType === 'week' ? 4 : 3) && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground">
                                +{dayEvents.length - (viewType === 'week' ? 4 : 3)} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - nur bei month/week Ansicht */}
          {viewType !== 'gantt' && (
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
                        {selectedDateEvents.map(event => {
                          const houseColor = getHouseColor(event.house_id);
                          return (
                            <div key={event.id} className="p-2 rounded border flex items-start gap-2">
                              <div className={cn("w-3 h-3 rounded-full mt-1 shrink-0", houseColor.bg)} />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm">{event.title}</div>
                                <div className="text-xs text-muted-foreground">{event.house}</div>
                                {event.status && (
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {event.status}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
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
                  
                  {/* Event-Typen */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                      <span className="text-sm">Check-in</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                      <span className="text-sm">Check-out</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-sm">Reinigung</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-violet-500 shrink-0" />
                      <span className="text-sm">Wäsche</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Unterkünfte</h4>
                  <div className="space-y-2">
                    {houses.map(house => {
                      const houseColor = getHouseColor(house.id);
                      return (
                        <div key={house.id} className="flex items-center space-x-2">
                          <div className={cn("w-3 h-3 rounded-full shrink-0", houseColor.bg)} />
                          <span className="text-sm truncate">{house.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        </>
      </main>
      <Footer />
      </div>
    </div>
    </PullToRefresh>

    {/* Mobile Bottom Navigation */}
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-sky-50 dark:bg-sky-950/30 border-t border-sky-200 dark:border-sky-900 pb-[env(safe-area-inset-bottom)] shadow-lg">
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
          <span className="font-medium text-sm">Hinweise</span>
        </button>
        <button
          onClick={() => chatProps.setIsChatOpen(true)}
          className="flex-1 w-full h-16 flex flex-col items-center justify-center gap-1 text-muted-foreground relative"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={2.25} />
          <span className="font-medium text-sm">Chat</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
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