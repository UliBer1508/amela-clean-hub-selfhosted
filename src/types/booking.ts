export interface Guest {
  id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  nationality?: string | null;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  birth_date?: string | null;
  travel_document?: string | null;
  notes?: string | null;
}

export interface ServiceTask {
  id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: 'cancelled' | 'completed' | 'scheduled' | 'in_progress' | 'delayed';
  assigned_staff_id: string;
  provider_id: string;
  completed_at?: string;
  notes?: string;
  payment_status?: 'paid' | 'unpaid' | 'pending';
  service_providers?: {
    name: string;
  };
}

export interface House {
  name: string;
  address: string;
  rental_type?: string;
}

export interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  number_of_guests: number;
  status: string;
  house_id: string;
  houses?: House;
  guests?: Guest | null;
  service_tasks?: ServiceTask[];
}

export interface TaskEditingState {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: ServiceTask['status'];
}

// Standalone Cleaning Task (ohne Buchung)
export interface StandaloneCleaningTask {
  id: string;
  house_id: string;
  service_type: 'cleaning';
  scheduled_date: string;
  scheduled_time: string;
  status: 'cancelled' | 'completed' | 'scheduled' | 'in_progress' | 'delayed';
  assigned_staff_id: string | null;
  provider_id?: string | null;
  notes?: string;
  payment_status?: 'paid' | 'unpaid' | 'pending';
  houses?: House;
  service_providers?: {
    name: string;
  };
}

// Union Type für beide Arten von Einträgen
export type CleaningEntry = 
  | { type: 'booking'; data: Booking }
  | { type: 'standalone'; data: StandaloneCleaningTask };

export type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed';
export type TimeFilter = 'all' | 'today' | 'week' | 'thisWeek' | 'nextWeek' | 'month' | '3months' | '6months' | '12months';
export type StaffFilter = string; // Staff-ID oder leerer String für "alle"
export type HouseFilter = 'all' | string; // 'all' or house ID
export type ProviderFilter = 'all' | 'unassigned' | string; // 'all', 'unassigned', or provider ID