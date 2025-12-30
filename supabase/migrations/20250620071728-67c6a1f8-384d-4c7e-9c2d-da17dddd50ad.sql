
-- Add company_name field to work_orders table
ALTER TABLE public.work_orders 
ADD COLUMN company_name TEXT;

-- Add attachments field to store file URLs/paths
ALTER TABLE public.work_orders 
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Create work_order_templates table
CREATE TABLE public.work_order_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_items JSONB DEFAULT '[]'::jsonb, -- Array of default work items
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on work_order_templates
ALTER TABLE public.work_order_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_order_templates
CREATE POLICY "Users can view their own templates" 
  ON public.work_order_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
  ON public.work_order_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
  ON public.work_order_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
  ON public.work_order_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for updated_at on work_order_templates
CREATE TRIGGER update_work_order_templates_updated_at
  BEFORE UPDATE ON public.work_order_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for work order attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('work-order-attachments', 'work-order-attachments', true);

-- Create storage policies for work order attachments
CREATE POLICY "Users can upload their own work order files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'work-order-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own work order files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'work-order-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own work order files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'work-order-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own work order files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'work-order-attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
