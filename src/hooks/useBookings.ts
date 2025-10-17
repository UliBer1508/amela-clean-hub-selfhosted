import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking, StatusFilter, TimeFilter, StaffFilter, HouseFilter } from '@/types/booking';
import { APP_CONFIG } from '@/constants/app';
import { isWithinTimeRange } from '@/utils/date';
import { sanitizeSearchTerm } from '@/utils/validation';

export const useBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchBookings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add cache-busting parameters for force refresh
      const cacheBuster = forceRefresh ? `?t=${Date.now()}` : '';
      
      // Create a new Supabase client instance for force refresh
      const clientToUse = forceRefresh ? 
        supabase.from('bookings') : 
        supabase.from('bookings');
      
      // Fetch bookings with cleaning tasks (for main cleaning portal)
      const { data: cleaningData, error: cleaningError } = await clientToUse
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
            completed_at,
            notes,
            payment_status,
            service_providers (
              name
            )
          )
        `)
        .eq('service_tasks.service_type', 'cleaning')
        .limit(APP_CONFIG.ITEMS_PER_PAGE);

      // Fetch all bookings (for calendar view)
      const { data: allData, error: allError } = await supabase
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
          service_tasks (
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
            service_providers (
              name
            )
          )
        `)
        .order('check_in', { ascending: true });

      if (cleaningError) throw cleaningError;
      if (allError) throw allError;
      
      // Cast the data to match our Booking interface
      const bookingsData = cleaningData as unknown as Booking[];
      const allBookingsData = allData as unknown as Booking[];
      
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
      
      setBookings(bookingsWithCleaning);
      setAllBookings(allBookingsData || []);
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

  useEffect(() => {
    fetchBookings();
    
    // Realtime-Subscription für bookings
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking changed:', payload);
          fetchBookings();
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
        (payload) => {
          console.log('Service task changed:', payload);
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [fetchBookings]);

  const updateTaskStatus = useCallback(async (
    taskId: string, 
    newStatus: 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed'
  ) => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
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

  const filteredBookings = useCallback((
    searchTerm: string,
    statusFilter: StatusFilter,
    staffFilter: StaffFilter,
    timeFilter: TimeFilter,
    houseFilter: HouseFilter
  ): Booking[] => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm.toLowerCase());
    
    return bookings.filter(booking => {
      const matchesSearch = !sanitizedSearch || 
        booking.guest_name?.toLowerCase().includes(sanitizedSearch) ||
        booking.houses?.name?.toLowerCase().includes(sanitizedSearch) ||
        booking.houses?.address?.toLowerCase().includes(sanitizedSearch);

      const matchesStatus = statusFilter === 'all' || 
        booking.service_tasks?.some(task => task.status === statusFilter);
      
      const matchesStaff = staffFilter === 'all' || 
        booking.service_tasks?.some(task => {
          if (!task.service_providers?.name) return false;
          const providerName = task.service_providers.name.toLowerCase();
          return (
            (staffFilter === 'amela' && providerName.includes('amela')) ||
            (staffFilter === 'tatort' && providerName.includes('tatort'))
          );
        });
      
      const matchesTime = timeFilter === 'all' || 
        booking.service_tasks?.some(task => isWithinTimeRange(task.scheduled_date, timeFilter));
      
      const matchesHouse = houseFilter === 'all' || booking.house_id === houseFilter;
      
      return matchesSearch && matchesStatus && matchesStaff && matchesTime && matchesHouse;
    });
  }, [bookings]);

  const totalCleaningTasks = useMemo(() => 
    bookings.reduce((total, booking) => 
      total + (booking.service_tasks?.length || 0), 0
    ), [bookings]
  );

  return {
    bookings,
    allBookings, // All bookings for calendar view
    loading,
    error,
    totalCleaningTasks,
    lastRefresh,
    updateTaskStatus,
    updateTaskDateTime,
    updateTaskStaff,
    filteredBookings,
    refetch: fetchBookings,
    forceRefresh
  };
};