
-- Create drivers table to store Motive driver data
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motive_driver_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  license_number TEXT,
  license_state TEXT,
  license_expiry DATE,
  role TEXT DEFAULT 'driver',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sync_logs table to track synchronization status
CREATE TABLE public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'drivers', 'vehicles', 'all_entities'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'error'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_details JSONB DEFAULT '{}'::jsonb
);

-- Add missing fields to vehicles table for complete Motive integration
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS license_plate TEXT,
ADD COLUMN IF NOT EXISTS fuel_type TEXT,
ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT 'truck',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_motive_id ON public.drivers(motive_driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_motive_id ON public.vehicles(motive_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_type_status ON public.sync_logs(sync_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON public.sync_logs(started_at DESC);

-- Add trigger to update updated_at timestamp for drivers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_drivers_updated_at 
    BEFORE UPDATE ON public.drivers 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
