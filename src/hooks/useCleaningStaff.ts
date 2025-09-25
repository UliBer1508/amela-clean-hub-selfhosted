import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CleaningStaff, CleaningStaffFormData, StaffFilter, StaffSortBy, StaffStats } from '@/types/staff';
import { sanitizeSearchTerm } from '@/utils/validation';

export const useCleaningStaff = () => {
  const [staff, setStaff] = useState<CleaningStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('cleaning_staff')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setStaff(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Laden der Putzkräfte';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const createStaff = useCallback(async (formData: CleaningStaffFormData) => {
    try {
      const { error } = await supabase
        .from('cleaning_staff')
        .insert({
          ...formData,
          is_active: true,
          quality_rating: 0,
          total_assignments: 0,
          completed_assignments: 0
        });

      if (error) throw error;
      
      await fetchStaff();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen der Putzkraft';
      return { success: false, error: errorMessage };
    }
  }, [fetchStaff]);

  const updateStaff = useCallback(async (id: string, updates: Partial<CleaningStaffFormData>) => {
    try {
      const { error } = await supabase
        .from('cleaning_staff')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchStaff();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Aktualisieren der Putzkraft';
      return { success: false, error: errorMessage };
    }
  }, [fetchStaff]);

  const toggleStaffStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('cleaning_staff')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      await fetchStaff();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Ändern des Status';
      return { success: false, error: errorMessage };
    }
  }, [fetchStaff]);

  const deleteStaff = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('cleaning_staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchStaff();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Fehler beim Löschen der Putzkraft';
      return { success: false, error: errorMessage };
    }
  }, [fetchStaff]);

  const filteredAndSortedStaff = useCallback((
    searchTerm: string,
    statusFilter: StaffFilter,
    sortBy: StaffSortBy
  ): CleaningStaff[] => {
    const sanitizedSearch = sanitizeSearchTerm(searchTerm.toLowerCase());
    
    let filtered = staff.filter(member => {
      const matchesSearch = !sanitizedSearch || 
        member.name?.toLowerCase().includes(sanitizedSearch) ||
        member.email?.toLowerCase().includes(sanitizedSearch) ||
        member.address?.toLowerCase().includes(sanitizedSearch);

      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && member.is_active) ||
        (statusFilter === 'inactive' && !member.is_active);
      
      return matchesSearch && matchesStatus;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.quality_rating - a.quality_rating;
        case 'assignments':
          return b.total_assignments - a.total_assignments;
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return filtered;
  }, [staff]);

  const stats = useMemo((): StaffStats => {
    const activeStaff = staff.filter(s => s.is_active);
    const totalRating = staff.reduce((sum, s) => sum + s.quality_rating, 0);
    const totalAssignments = staff.reduce((sum, s) => sum + s.total_assignments, 0);

    return {
      totalStaff: staff.length,
      activeStaff: activeStaff.length,
      averageRating: staff.length > 0 ? totalRating / staff.length : 0,
      totalAssignments
    };
  }, [staff]);

  return {
    staff,
    loading,
    error,
    stats,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
    filteredAndSortedStaff,
    refetch: fetchStaff
  };
};