import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking, StatusFilter, TimeFilter, StaffFilter, HouseFilter, ProviderFilter, StandaloneCleaningTask, CleaningEntry } from '@/types/booking';
import { APP_CONFIG } from '@/constants/app';
import { isWithinTimeRange } from '@/utils/date';
import { sanitizeSearchTerm } from '@/utils/validation';
import { getGuestName } from '@/lib/guestHelpers';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [standaloneCleanings, setStandaloneCleanings] = useState<StandaloneCleaningTask[]>([]);
  const [combinedEntries, setCombinedEntries] = useState<CleaningEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchBookings = useCallback(async (_forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const { data: cleaningData, error: cleaningError } = await supabase
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
          houses!bookings_house_id_fkey (
            name,
            address
          ),
          guests (*),
          service_tasks!service_tasks_booking_id_fkey!inner (
            id,
            service_type,
            scheduled_date,
            scheduled_time,
            status,
            assigned_staff_id,
            provider_id,
            completed_at,
            notes,
            payment_status,
            service_providers!service_tasks_provider_id_fkey (
              name
            )
          )
        `)
        .eq('service_tasks.service_type', 'cleaning')
        .limit(APP_CONFIG.ITEMS_PER_PAGE);

      if (cleaningError) throw cleaningError;

      const bookingsData = cleaningData as unknown as Booking[];

      const bookingsWithCleaning = bookingsData?.filter(booking =>
        booking.service_tasks && booking.service_tasks.length > 0
      ) || [];

      // Sort by earliest cleaning date first
      bookingsWithCleaning.sort((a, b) => {
        const aDate = a.service_tasks?.[0]?.scheduled_date;
        const bDate = b.service_tasks?.[0]?.scheduled_date;
        if (!aDate || !bDate) return 0;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });

      // Fetch standalone cleaning tasks (ohne booking_id)
      const { data: standaloneData, error: standaloneError } = await supabase
        .from('service_tasks')
        .select(`
          id,
          house_id,
          service_type,
          scheduled_date,
          scheduled_time,
          status,
          assigned_staff_id,
          provider_id,
          notes,
          payment_status,
          houses!service_tasks_house_id_fkey (
            name,
            address
          ),
          service_providers!service_tasks_provider_id_fkey (
            name
          )
        `)
        .eq('service_type', 'cleaning')
        .is('booking_id', null)
        .order('scheduled_date', { ascending: true });

      if (standaloneError) throw standaloneError;

      const standaloneCleaningsData = standaloneData as unknown as StandaloneCleaningTask[];
      setStandaloneCleanings(standaloneCleaningsData || []);

      const combined: CleaningEntry[] = [
        ...bookingsWithCleaning.map(b => ({ type: 'booking' as const, data: b })),
        ...(standaloneCleaningsData || []).map(s => ({ type: 'standalone' as const, data: s }))
      ];

      combined.sort((a, b) => {
        const aDate = a.type === 'booking'
          ? a.data.service_tasks?.[0]?.scheduled_date
          : a.data.scheduled_date;
        const bDate = b.type === 'booking'
          ? b.data.service_tasks?.[0]?.scheduled_date
          : b.data.scheduled_date;
        if (!aDate || !bDate) return 0;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      });

      setCombinedEntries(combined);
      setBookings(bookingsWithCleaning);
      setLastRefresh(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden der Buchungen';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const forceRefresh = useCallback(() => {
    return fetchBookings(true);
  }, [fetchBookings]);

  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => {
      fetchBookings();
    }, 500);
  }, [fetchBookings]);

  useEffect(() => {
    fetchBookings();

    // Realtime-Subscription für bookings
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    // Realtime-Subscription für service_tasks
    const tasksChannel = supabase
      .channel('service-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_tasks'
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchBookings, debouncedFetch]);

  const updateTaskStatus = useCallback(async (
    taskId: string, 
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed'
  ) => {
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
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Status';
      return { success: false, error: errorMessage };
    }
  }, [fetchBookings]);

  const updateTaskDateTime = useCallback(async (
    taskId: string, 
    newDate: Date, 
    newTime: string
  ) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          scheduled_date: newDate.toISOString().split('T')[0],
          scheduled_time: newTime
        })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Termins';
      return { success: false, error: errorMessage };
    }
  }, [fetchBookings]);

  const updateTaskStaff = useCallback(async (
    taskId: string, 
    staffId: string | null
  ) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          assigned_staff_id: staffId
        })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchBookings();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Zuweisen der Putzkraft';
      return { success: false, error: errorMessage };
    }
  }, [fetchBookings]);

  const filteredEntries = useCallback((
    searchTerm: string,
    statusFilter: StatusFilter,
    staffFilter: StaffFilter,
    timeFilter: TimeFilter,
    houseFilter: HouseFilter,
    providerFilter: ProviderFilter,
    includeCheckedIn: boolean = false
  ): CleaningEntry[] => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm.toLowerCase());
    
    const filtered = combinedEntries.filter(entry => {
      if (entry.type === 'booking') {
        const booking = entry.data;
        
        // Prüfe ob Buchung eingecheckt ist - nur anzeigen wenn Checkbox aktiv
        const isCheckedIn = booking.status === 'checked_in';
        if (isCheckedIn && !includeCheckedIn) {
          return false;
        }
        
        const matchesSearch = !sanitizedSearch || 
          getGuestName(booking).toLowerCase().includes(sanitizedSearch) ||
          booking.houses?.name?.toLowerCase().includes(sanitizedSearch) ||
          booking.houses?.address?.toLowerCase().includes(sanitizedSearch);

        // Bei eingecheckten Buchungen (wenn Checkbox aktiv) den Status-Filter ignorieren
        const matchesStatus = statusFilter === 'all' || 
          (isCheckedIn && includeCheckedIn) ||
          booking.service_tasks?.some(task => task.status === statusFilter);
        
        const matchesStaff = !staffFilter || staffFilter === 'all' || 
          booking.service_tasks?.some(task => task.assigned_staff_id === staffFilter);
        
        const matchesTime = timeFilter === 'all' || 
          booking.service_tasks?.some(task => isWithinTimeRange(task.scheduled_date, timeFilter));
        
        const matchesHouse = houseFilter === 'all' || booking.house_id === houseFilter;
        
        const matchesProvider = providerFilter === 'all' || 
          booking.service_tasks?.some(task => {
            if (providerFilter === 'unassigned') {
              return !task.provider_id;
            }
            return task.provider_id === providerFilter;
          });
        
        return matchesSearch && matchesStatus && matchesStaff && matchesTime && matchesHouse && matchesProvider;
      } else {
        const cleaning = entry.data;
        const matchesSearch = !sanitizedSearch || 
          cleaning.houses?.name?.toLowerCase().includes(sanitizedSearch) ||
          cleaning.houses?.address?.toLowerCase().includes(sanitizedSearch);
        
        const matchesStatus = statusFilter === 'all' || cleaning.status === statusFilter;
        
        const matchesStaff = !staffFilter || staffFilter === 'all' || cleaning.assigned_staff_id === staffFilter;
        
        const matchesTime = timeFilter === 'all' || 
          isWithinTimeRange(cleaning.scheduled_date, timeFilter);
        
        const matchesHouse = houseFilter === 'all' || cleaning.house_id === houseFilter;
        
        const matchesProvider = providerFilter === 'all' || 
          (providerFilter === 'unassigned' ? !cleaning.provider_id : cleaning.provider_id === providerFilter);
        
        return matchesSearch && matchesStatus && matchesStaff && matchesTime && matchesHouse && matchesProvider;
      }
    });

    const isCompleted = statusFilter === 'completed';

    const getSortDate = (entry: CleaningEntry): number => {
      if (entry.type === 'booking') {
        const tasks = entry.data.service_tasks || [];
        if (isCompleted) {
          // Neuester abgeschlossener Task
          const completed = tasks
            .filter((t: any) => t.status === 'completed')
            .map((t: any) => t.completed_at || t.scheduled_date)
            .filter(Boolean) as string[];
          const dates = completed.length ? completed : tasks.map((t: any) => t.scheduled_date).filter(Boolean);
          return dates.length ? Math.max(...dates.map(d => new Date(d).getTime())) : 0;
        }
        const dates = tasks.map((t: any) => t.scheduled_date).filter(Boolean) as string[];
        return dates.length ? Math.min(...dates.map(d => new Date(d).getTime())) : 0;
      }
      const c: any = entry.data;
      const d = isCompleted ? (c.completed_at || c.scheduled_date) : c.scheduled_date;
      return d ? new Date(d).getTime() : 0;
    };

    return filtered.sort((a, b) => {
      const aT = getSortDate(a);
      const bT = getSortDate(b);
      return isCompleted ? bT - aT : aT - bT;
    });
  }, [combinedEntries]);

  const totalCleaningTasks = useMemo(() => {
    const bookingTasks = bookings.reduce((total, booking) => 
      total + (booking.service_tasks?.length || 0), 0
    );
    const standaloneTasks = standaloneCleanings.length;
    return bookingTasks + standaloneTasks;
  }, [bookings, standaloneCleanings]);

  return {
    bookings,
    standaloneCleanings,
    combinedEntries,
    loading,
    error,
    totalCleaningTasks,
    lastRefresh,
    updateTaskStatus,
    updateTaskDateTime,
    updateTaskStaff,
    filteredBookings: filteredEntries,
    refetch: fetchBookings,
    forceRefresh
  };
};