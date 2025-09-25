-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL DEFAULT 'Amela',
  toast_notifications BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT false,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  sound_notifications BOOLEAN NOT NULL DEFAULT true,
  notify_new_tasks BOOLEAN NOT NULL DEFAULT true,
  notify_task_changes BOOLEAN NOT NULL DEFAULT true,
  notify_status_updates BOOLEAN NOT NULL DEFAULT true,
  notify_urgent_tasks BOOLEAN NOT NULL DEFAULT true,
  email_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (since this is for internal staff management)
CREATE POLICY "Allow all operations on notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (true);

-- Insert default settings for Amela
INSERT INTO public.notification_preferences (
  user_name,
  toast_notifications,
  email_notifications, 
  push_notifications,
  sound_notifications,
  notify_new_tasks,
  notify_task_changes,
  notify_status_updates,
  notify_urgent_tasks,
  email_address
) VALUES (
  'Amela',
  true,
  false,
  true, 
  true,
  true,
  true,
  true,
  true,
  'amela@reinigungsservice.at'
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_notification_preferences_updated_at();