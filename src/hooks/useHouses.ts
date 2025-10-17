import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface House {
  id: string;
  name: string;
  address: string;
}

export const useHouses = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: fetchError } = await supabase
          .from('houses')
          .select('id, name, address')
          .order('name');

        if (fetchError) throw fetchError;
        
        setHouses(data || []);
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'Fehler beim Laden der Häuser';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchHouses();

    // Realtime-Subscription für houses
    const housesChannel = supabase
      .channel('houses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'houses'
        },
        (payload) => {
          console.log('House changed:', payload);
          fetchHouses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(housesChannel);
    };
  }, []);

  return { houses, loading, error };
};