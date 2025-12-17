-- Füge Foreign Key Constraint zwischen bookings.guest_id und guests.id hinzu
ALTER TABLE public.bookings 
ADD CONSTRAINT fk_bookings_guest 
FOREIGN KEY (guest_id) 
REFERENCES public.guests(id)
ON DELETE SET NULL;