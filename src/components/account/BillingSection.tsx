
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Calendar, Download, Zap, Users, Truck } from "lucide-react";
// import { supabase } from "@/integrations/supabase/client"; 
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface Subscription {
  id: string;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment_date: string;
  invoice_url?: string;
}

interface UsageData {
  feature_name: string;
  usage_count: number;
  usage_limit: number;
}

const BillingSection = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data loading
    const loadMockData = async () => {
      setLoading(true);
      // Simulate delay
      await new Promise(r => setTimeout(r, 500));

      // Default to free/starter plan (null subscription implies free)
      setSubscription(null);
      setPaymentHistory([]);
      setUsage([
        { feature_name: "trucks", usage_count: 5, usage_limit: 5 },
        { feature_name: "drivers", usage_count: 2, usage_limit: 10 }
      ]);
      setLoading(false);
    };
    loadMockData();
  }, [user]);

  // const fetchBillingData = ... (removed)

  const handleUpgrade = () => {
    toast.info("Upgrade functionality coming soon!");
  };

  const handleManageBilling = () => {
    toast.info("Billing management portal coming soon!");
  };

  const formatCurrency = (amount: number, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      trialing: 'bg-blue-100 text-blue-800',
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPlanFeatures = (planName: string) => {
    const features = {
      starter: { trucks: 5, drivers: 10, features: 'Basic' },
      professional: { trucks: 25, drivers: 50, features: 'Advanced' },
      enterprise: { trucks: 'Unlimited', drivers: 'Unlimited', features: 'Premium' },
    };

    return features[planName as keyof typeof features] || features.starter;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing & Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planFeatures = subscription ? getPlanFeatures(subscription.plan_name) : getPlanFeatures('starter');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Billing & Subscription
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan */}
        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold capitalize">
                {subscription?.plan_name || 'Starter'} Plan
              </h3>
              <p className="text-sm text-gray-600">
                {subscription?.plan_price
                  ? `${formatCurrency(subscription.plan_price)} per ${subscription.billing_cycle}`
                  : 'Free tier'
                }
              </p>
            </div>
            <div className="text-right">
              {subscription?.status && getStatusBadge(subscription.status)}
              {subscription?.current_period_end && (
                <p className="text-sm text-gray-600 mt-1">
                  Renews {formatDate(subscription.current_period_end)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-blue-600" />
              <span>{planFeatures.trucks} Trucks</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span>{planFeatures.drivers} Drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span>{planFeatures.features} Features</span>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        {usage.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Current Usage</h4>
            <div className="space-y-3">
              {usage.map((item) => (
                <div key={item.feature_name} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{item.feature_name.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((item.usage_count / item.usage_limit) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">
                      {item.usage_count}/{item.usage_limit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={handleUpgrade} className="flex-1">
            Upgrade Plan
          </Button>
          <Button variant="outline" onClick={handleManageBilling}>
            Manage Billing
          </Button>
        </div>

        <Separator />

        {/* Payment History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Recent Payments</h4>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          {paymentHistory.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-4">
              No payment history available
            </p>
          ) : (
            <div className="space-y-2">
              {paymentHistory.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payment.status)}
                    {payment.invoice_url && (
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingSection;
