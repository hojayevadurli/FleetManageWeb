
-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL UNIQUE,
  vin TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles table (public access for now)
CREATE POLICY "Anyone can view vehicles" 
  ON public.vehicles 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create vehicles" 
  ON public.vehicles 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update vehicles" 
  ON public.vehicles 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete vehicles" 
  ON public.vehicles 
  FOR DELETE 
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON public.vehicles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
