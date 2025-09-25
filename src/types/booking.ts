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
  service_providers?: {
    name: string;
  };
}

export interface House {
  name: string;
  address: string;
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
  service_tasks?: ServiceTask[];
}

export interface TaskEditingState {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: ServiceTask['status'];
}

export type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled' | 'in_progress' | 'delayed';
export type TimeFilter = 'all' | 'today' | 'week' | 'month' | '3months' | '6months' | '12months';
export type StaffFilter = 'all' | 'amela' | 'tatort';
export type HouseFilter = 'all' | string; // 'all' or house ID