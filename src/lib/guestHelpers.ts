/**
 * Helper-Funktionen für Gast-Daten mit Fallback-Logik.
 * Nutzt die guests-Relation falls verfügbar, sonst Legacy-Felder aus bookings.
 */

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

interface BookingWithGuest {
  guests?: Guest | null;
  guest_name?: string;
  guest_email?: string | null;
  guest_phone?: string | null;
  nationality?: string | null;
}

export const getGuestName = (booking: BookingWithGuest | null | undefined): string => {
  if (!booking) return 'Unbekannt';
  return booking.guests?.name || booking.guest_name || 'Unbekannt';
};

export const getGuestEmail = (booking: BookingWithGuest | null | undefined): string | null => {
  if (!booking) return null;
  return booking.guests?.email || booking.guest_email || null;
};

export const getGuestPhone = (booking: BookingWithGuest | null | undefined): string | null => {
  if (!booking) return null;
  return booking.guests?.phone || booking.guest_phone || null;
};

export const getGuestNationality = (booking: BookingWithGuest | null | undefined): string | null => {
  if (!booking) return null;
  return booking.guests?.nationality || booking.nationality || null;
};
