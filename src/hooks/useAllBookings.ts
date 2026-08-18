import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/booking';

/**
 * Hook zum Laden ALLER Buchungen (für Kalenderansicht).
 * Separat vom CleaningPortal-Hook (useBookings), um doppeltes Fetching zu vermeiden.
 *
 * Änderungen 18.08.2026 (Belegungsraster):
 * - `houses` als `!inner` mit Filter `rental_type = 'tourist'`. Ohne den Filter
 *   kämen die Dauermietobjekte als eigene Zeilen ins Raster; `useHouses`
 *   filtert bereits so, die Buchungsabfrage tat es bisher nicht.
 * - `linen_orders` mitgeladen. Das Raster zeigt am unteren Rand der Zelle, ob
 *   die Wäsche für diesen Wechsel schon da ist — dafür braucht der Kalender
 *   die Bestellung. Bisher lud nur `useBookings` sie.
 * - Realtime-Kanal für `linen_orders` ergänzt, sonst bliebe eine gerade als
 *   geliefert gemeldete Bestellung im Kalender offen stehen.
 */
export const useAllBookings = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchAllBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          number_of_guests,
          status,
          house_id,
          houses!bookings_house_id_fkey!inner (
            name,
            address,
            rental_type
          ),
          guests (*),
          service_tasks!service_tasks_booking_id_fkey (
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
          ),
          linen_orders!linen_orders_booking_id_fkey (
            id,
            status,
            delivery_date,
            delivery_time,
            total_items
          )
        `)
        .eq('houses.rental_type', 'tourist')
        .order('check_in', { ascending: true });

      if (fetchError) throw fetchError;
      setAllBookings((data as unknown as Booking[]) || []);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Buchungen');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    fetchTimeoutRef.current = setTimeout(() => fetchAllBookings(), 500);
  }, [fetchAllBookings]);

  useEffect(() => {
    fetchAllBookings();

    const bookingsChannel = supabase
      .channel('all-bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => debouncedFetch())
      .subscribe();
    const tasksChannel = supabase
      .channel('all-tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_tasks' }, () => debouncedFetch())
      .subscribe();
    const linenChannel = supabase
      .channel('all-linen-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'linen_orders' }, () => debouncedFetch())
      .subscribe();

    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(linenChannel);
    };
  }, [fetchAllBookings, debouncedFetch]);

  return {
    allBookings,
    loading,
    error,
    lastRefresh,
    refetch: fetchAllBookings,
    forceRefresh: fetchAllBookings,
  };
};
