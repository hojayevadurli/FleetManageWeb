
-- Add Motive integration fields to the vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN motive_vehicle_id TEXT,
ADD COLUMN current_location JSONB,
ADD COLUMN last_location_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN odometer_reading INTEGER,
ADD COLUMN engine_hours NUMERIC(8,2),
ADD COLUMN fuel_level NUMERIC(5,2),
ADD COLUMN status_details TEXT,
ADD COLUMN driver_assigned TEXT;

-- Add indexes for better performance
CREATE INDEX idx_vehicles_motive_id ON public.vehicles(motive_vehicle_id);
CREATE INDEX idx_vehicles_location_update ON public.vehicles(last_location_update);

-- Add comments for documentation
COMMENT ON COLUMN public.vehicles.motive_vehicle_id IS 'External reference to Motive system vehicle ID';
COMMENT ON COLUMN public.vehicles.current_location IS 'JSON object containing lat/lng coordinates';
COMMENT ON COLUMN public.vehicles.last_location_update IS 'Timestamp of last location update from Motive';
COMMENT ON COLUMN public.vehicles.odometer_reading IS 'Current odometer reading in miles/kilometers';
COMMENT ON COLUMN public.vehicles.engine_hours IS 'Current engine hours';
COMMENT ON COLUMN public.vehicles.fuel_level IS 'Current fuel level as percentage (0-100)';
COMMENT ON COLUMN public.vehicles.status_details IS 'Detailed status information from Motive';
COMMENT ON COLUMN public.vehicles.driver_assigned IS 'Currently assigned driver name or ID';
