
-- Create work_orders table
CREATE TABLE public.work_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  work_order_number TEXT NOT NULL UNIQUE,
  vehicle_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL DEFAULT 'truck', -- 'truck' or 'trailer'
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  assigned_to TEXT,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  estimated_hours INTEGER,
  actual_hours INTEGER,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own work orders" 
  ON public.work_orders 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work orders" 
  ON public.work_orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work orders" 
  ON public.work_orders 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work orders" 
  ON public.work_orders 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON public.work_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate work order numbers
CREATE OR REPLACE FUNCTION public.generate_work_order_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  formatted_number TEXT;
BEGIN
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(work_order_number FROM 'WO-(\d+)') AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.work_orders;
  
  -- Format as WO-001, WO-002, etc.
  formatted_number := 'WO-' || LPAD(next_number::TEXT, 3, '0');
  
  RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;
