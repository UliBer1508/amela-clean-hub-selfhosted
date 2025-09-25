export interface CleaningStaff {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  hourly_rate: number | null;
  is_active: boolean;
  availability_days: string[];
  quality_rating: number;
  total_assignments: number;
  completed_assignments: number;
  service_provider_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CleaningStaffFormData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  hourly_rate?: number;
  availability_days: string[];
  notes?: string;
}

export type StaffFilter = 'all' | 'active' | 'inactive';
export type StaffSortBy = 'name' | 'rating' | 'assignments' | 'created_at';

export interface StaffStats {
  totalStaff: number;
  activeStaff: number;
  averageRating: number;
  totalAssignments: number;
}