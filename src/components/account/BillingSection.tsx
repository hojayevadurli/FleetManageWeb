import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import tenantsApi, { Tenant } from "@/lib/tenantsApi";
import billingApi, { STRIPE_PRICE_ID } from "@/lib/billingApi";
import { differenceInDays, format, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const BillingSection = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // Still hardcoded as per instruction to do fleet size later
  const truckCount = 5;
  const pricePerTruck = 5;
  const estimatedMonthlyCost = truckCount * pricePerTruck;

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const data = await tenantsApi.getCurrent();
        setTenant(data);
      } catch (error) {
        console.error("Failed to fetch tenant data", error);
        toast.error("Failed to load subscription details");
      } finally {
        setLoading(false);
      }
    };

    fetchTenantData();
  }, []);

  const handleAddPaymentMethod = async () => {
    setCheckingOut(true);
    try {
      const response = await billingApi.createCheckoutSession(STRIPE_PRICE_ID);
      window.location.href = response.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout session");
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  // Calculate trial info
  const trialEndDate = tenant?.trialEndsAt ? parseISO(tenant.trialEndsAt) : null;
  const trialDaysRemaining = trialEndDate ? differenceInDays(trialEndDate, new Date()) : 0;

  const isTrialActive = trialDaysRemaining > 0;
  const isPaid = tenant?.status === 'Active' && !isTrialActive;

  // Plan Display Logic
  const planName = tenant?.planKey === 'professional' ? 'Professional Plan' : 'Standard Plan';
  // Fallback to January 1, 2026 if no date provided, or format real date
  const nextBillingDate = tenant?.currentPeriodEnd
    ? format(parseISO(tenant.currentPeriodEnd), "MMM d, yyyy")
    : "Jan 1, 2026";

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-slate-400" />
          Billing & Subscription
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
          Manage your subscription and payment details
        </p>
      </div>

      <div className="p-6 space-y-8">
        {/* Trial Status Card */}
        {isTrialActive && (
          <div className="p-6 rounded-2xl bg-orange-50 border border-orange-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-orange-900">Trial Status</h3>
              </div>
              <p className="text-orange-800 font-medium">
                <span className="font-black">{trialDaysRemaining} days remaining</span> in your trial
              </p>
              <p className="text-sm text-orange-600/80 font-medium mt-1">
                Trial ends: {trialEndDate ? format(trialEndDate, "MMMM d, yyyy") : 'N/A'}
              </p>
            </div>
            <div className="bg-white/50 px-4 py-2 rounded-xl border border-orange-100">
              <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Status</p>
              <p className="font-black text-orange-600">Active Trial</p>
            </div>
          </div>
        )}

        {/* Pricing Calculation */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4">Projected Monthly Cost</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="font-medium text-slate-700">Current Fleet Size</span>
              </div>
              <span className="font-bold text-slate-900">{truckCount} trucks</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="font-medium text-slate-700 ml-11">Price per truck</span>
              <span className="font-bold text-slate-900">${pricePerTruck}.00 / month</span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
                <h3 className="text-3xl font-bold text-slate-900">{planName}</h3>
                <p className="text-slate-500 mt-2">Billed monthly • Next billing date: {nextBillingDate}</p>
              </div>
              <div className="text-right">
                <h3 className="text-3xl font-bold text-slate-900">$49<span className="text-lg text-slate-500 font-medium">/mo</span></h3>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex justify-end">
          <Button
            onClick={handleAddPaymentMethod}
            disabled={checkingOut}
            className="bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 px-6 py-6 disabled:opacity-50"
          >
            {checkingOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              "Add Payment Method"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
