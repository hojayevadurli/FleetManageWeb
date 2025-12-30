
-- Create inspection templates table
CREATE TABLE public.inspection_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('truck', 'trailer', 'both')),
  is_pti BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create inspections table
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_id UUID REFERENCES public.inspection_templates(id) ON DELETE SET NULL,
  work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  driver_id TEXT,
  inspection_name TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  overall_result TEXT CHECK (overall_result IN ('pass', 'pass_with_issues', 'fail')),
  location JSONB,
  signature_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create inspection results table
CREATE TABLE public.inspection_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_category TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass', 'fail', 'na', 'needs_attention')),
  notes TEXT,
  photos TEXT[],
  videos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for inspection_templates
CREATE POLICY "Users can view their own inspection templates" 
  ON public.inspection_templates 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own inspection templates" 
  ON public.inspection_templates 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inspection templates" 
  ON public.inspection_templates 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own inspection templates" 
  ON public.inspection_templates 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create RLS policies for inspections
CREATE POLICY "Users can view their own inspections" 
  ON public.inspections 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own inspections" 
  ON public.inspections 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inspections" 
  ON public.inspections 
  FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own inspections" 
  ON public.inspections 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Create RLS policies for inspection_results
CREATE POLICY "Users can view inspection results for their inspections" 
  ON public.inspection_results 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections 
      WHERE inspections.id = inspection_results.inspection_id 
      AND inspections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inspection results for their inspections" 
  ON public.inspection_results 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections 
      WHERE inspections.id = inspection_results.inspection_id 
      AND inspections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update inspection results for their inspections" 
  ON public.inspection_results 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections 
      WHERE inspections.id = inspection_results.inspection_id 
      AND inspections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete inspection results for their inspections" 
  ON public.inspection_results 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections 
      WHERE inspections.id = inspection_results.inspection_id 
      AND inspections.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_inspection_templates_user_id ON public.inspection_templates(user_id);
CREATE INDEX idx_inspections_user_id ON public.inspections(user_id);
CREATE INDEX idx_inspections_template_id ON public.inspections(template_id);
CREATE INDEX idx_inspections_vehicle_id ON public.inspections(vehicle_id);
CREATE INDEX idx_inspection_results_inspection_id ON public.inspection_results(inspection_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_inspection_templates_updated_at 
  BEFORE UPDATE ON public.inspection_templates 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at 
  BEFORE UPDATE ON public.inspections 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
