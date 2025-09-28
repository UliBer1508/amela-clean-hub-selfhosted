-- Create table for booking card configuration settings
CREATE TABLE public.booking_card_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (we'll add proper policies later for admin-only access)
ALTER TABLE public.booking_card_config ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (will be restricted to admin later)
CREATE POLICY "Booking card config is accessible by everyone for now"
ON public.booking_card_config
FOR ALL
USING (true)
WITH CHECK (true);

-- Insert default configuration
INSERT INTO public.booking_card_config (config) VALUES (
  '{
    "showHouseName": true,
    "showHouseAddress": true,
    "showGuestName": true,
    "showGuestCount": true,
    "showGuestEmail": false,
    "showGuestPhone": false,
    "showCheckInDate": true,
    "showCheckOutDate": true,
    "showBookingNotes": true,
    "showBookingAmount": false,
    "showBookingStatus": false,
    "showNationality": false,
    "showPlatform": false,
    "showCleaningTasks": true,
    "showTaskStatus": true,
    "showTaskAssignment": true,
    "showTaskDateTime": true,
    "showTaskNotes": true,
    "showCurrency": false,
    "showBookingId": false,
    "showTaskActions": true,
    "showEditableNotes": true
  }'::jsonb
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_booking_card_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_card_config_updated_at
  BEFORE UPDATE ON public.booking_card_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_card_config_updated_at();