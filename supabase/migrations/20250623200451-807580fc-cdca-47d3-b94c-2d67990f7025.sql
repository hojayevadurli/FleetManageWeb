
-- Create billing tables for subscription management
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_name TEXT NOT NULL DEFAULT 'starter',
  plan_price DECIMAL(10,2),
  billing_cycle TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment history table
CREATE TABLE public.payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  invoice_url TEXT,
  payment_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER,
  period_start TIMESTAMPTZ DEFAULT now(),
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all billing tables
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for billing_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.billing_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON public.billing_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all subscriptions" 
  ON public.billing_subscriptions 
  FOR ALL 
  USING (true);

-- Create RLS policies for payment_history
CREATE POLICY "Users can view their own payment history" 
  ON public.payment_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all payment history" 
  ON public.payment_history 
  FOR ALL 
  USING (true);

-- Create RLS policies for usage_tracking
CREATE POLICY "Users can view their own usage" 
  ON public.usage_tracking 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all usage" 
  ON public.usage_tracking 
  FOR ALL 
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_billing_subscriptions_user_id ON public.billing_subscriptions(user_id);
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_usage_tracking_user_id ON public.usage_tracking(user_id);
