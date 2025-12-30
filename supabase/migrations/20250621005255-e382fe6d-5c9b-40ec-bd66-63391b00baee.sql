
-- Add new columns to shops table for enhanced functionality
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS hours_of_operation JSONB DEFAULT '{}';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create shop_ratings table for customer reviews and ratings
CREATE TABLE public.shop_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  user_id UUID DEFAULT auth.uid(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shop_services table for tracking service specialties
CREATE TABLE public.shop_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for shop_ratings
ALTER TABLE public.shop_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.shop_ratings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.shop_ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for own ratings" ON public.shop_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- Add RLS policies for shop_services
ALTER TABLE public.shop_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.shop_services
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.shop_services
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.shop_services
  FOR UPDATE USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_shop_ratings_updated_at 
  BEFORE UPDATE ON public.shop_ratings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update shop average rating when a new rating is added
CREATE OR REPLACE FUNCTION public.update_shop_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.shops 
  SET 
    average_rating = (
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM public.shop_ratings 
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.shop_ratings 
      WHERE shop_id = COALESCE(NEW.shop_id, OLD.shop_id)
    )
  WHERE id = COALESCE(NEW.shop_id, OLD.shop_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to automatically update shop ratings
CREATE TRIGGER update_shop_rating_on_insert
  AFTER INSERT ON public.shop_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_rating();

CREATE TRIGGER update_shop_rating_on_update
  AFTER UPDATE ON public.shop_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_rating();

CREATE TRIGGER update_shop_rating_on_delete
  AFTER DELETE ON public.shop_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_shop_rating();
