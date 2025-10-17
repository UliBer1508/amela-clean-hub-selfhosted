-- Aktiviere Realtime für service_tasks
ALTER TABLE service_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE service_tasks;

-- Aktiviere Realtime für houses
ALTER TABLE houses REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE houses;

-- Aktiviere Realtime für cleaning_staff
ALTER TABLE cleaning_staff REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE cleaning_staff;