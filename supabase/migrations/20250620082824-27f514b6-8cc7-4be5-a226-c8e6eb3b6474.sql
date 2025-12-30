
-- Create shops table to store shop information
CREATE TABLE public.shops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_name TEXT,
  shop_id TEXT UNIQUE NOT NULL,
  labor_rate DECIMAL(10,2) NOT NULL,
  rate_category TEXT CHECK (rate_category IN ('green', 'orange', 'red')) DEFAULT 'green',
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enhanced service_history table
CREATE TABLE public.service_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'trailer')),
  service_date DATE NOT NULL,
  work_completed TEXT NOT NULL,
  shop_id UUID REFERENCES public.shops(id),
  labor_hours DECIMAL(5,2),
  total_cost DECIMAL(10,2),
  mileage INTEGER,
  invoice_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for shops
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.shops
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.shops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.shops
  FOR UPDATE USING (true);

-- Add RLS policies for service_history
ALTER TABLE public.service_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.service_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.service_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.service_history
  FOR UPDATE USING (true);

-- Add trigger to update updated_at column
CREATE TRIGGER update_shops_updated_at 
  BEFORE UPDATE ON public.shops 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_history_updated_at 
  BEFORE UPDATE ON public.service_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique shop_id function
CREATE OR REPLACE FUNCTION public.generate_shop_id()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_number INTEGER;
  formatted_id TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(shop_id FROM 'SH-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.shops;
  
  formatted_id := 'SH-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN formatted_id;
END;
$$;
