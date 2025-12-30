
-- Create trailers table
CREATE TABLE public.trailers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL UNIQUE,
  vin TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on trailers table
ALTER TABLE public.trailers ENABLE ROW LEVEL SECURITY;

-- Create policies for trailers table (public access for now)
CREATE POLICY "Anyone can view trailers" 
  ON public.trailers 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can create trailers" 
  ON public.trailers 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update trailers" 
  ON public.trailers 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete trailers" 
  ON public.trailers 
  FOR DELETE 
  USING (true);

-- Create trigger to automatically update updated_at for trailers
CREATE TRIGGER update_trailers_updated_at 
    BEFORE UPDATE ON public.trailers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
