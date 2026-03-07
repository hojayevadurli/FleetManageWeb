import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import tenantsApi, { Tenant } from "@/lib/tenantsApi";
import billingApi, { STRIPE_PRICE_ID } from "@/lib/billingApi";
import equipmentApi from "@/lib/equipmentApi";
import { differenceInDays, format, parseISO, endOfMonth } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentOperationalStatus } from "@/lib/types";

const BillingSection = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [assetCount, setAssetCount] = useState(0);
  const [upcomingInvoiceAmount, setUpcomingInvoiceAmount] = useState<number | null>(null);

  const pricePerAsset = 6;
  const estimatedMonthlyCost = assetCount * pricePerAsset;

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success")) {
      toast.success("Subscription updated successfully!");
      navigate(location.pathname, { replace: true });
    } else if (params.get("canceled")) {
      toast.info("Checkout was canceled.", { description: "You have not been charged." });
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, navigate]);

  const [managing, setManaging] = useState(false);

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        const [tenantData, equipmentData, upcomingInvoice] = await Promise.all([
          tenantsApi.getCurrent(),
          equipmentApi.list(),
          billingApi.getUpcomingInvoice().catch(() => null)
        ]);
        const billableAssets = equipmentData.filter(e =>
          e.operationalStatus === EquipmentOperationalStatus.Active ||
          String(e.operationalStatus) === 'Active' ||
          e.operationalStatus === EquipmentOperationalStatus.InShop ||
          String(e.operationalStatus) === 'InShop'
        );
        setTenant(tenantData);
        setAssetCount(billableAssets.length);
        if (upcomingInvoice) {
          setUpcomingInvoiceAmount(upcomingInvoice.amountDue);
        }
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

  const handleManageSubscription = async () => {
    setManaging(true);
    try {
      const returnUrl = window.location.href; // current URL (e.g. localhost:5173/app/settings/billing)
      const response = await billingApi.createPortalSession(returnUrl);
      window.location.href = response.url;
    } catch (error: any) {
      console.error("Portal error:", error);
      console.error("Portal error details:", error.response?.data);
      toast.error("Failed to open billing portal");
      setManaging(false);
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

  let fallbackDate = new Date();
  if (isTrialActive && trialEndDate) {
    fallbackDate = trialEndDate;
  }

  // Fallback to end of the month if no date provided, or format real date
  const nextBillingDate = tenant?.currentPeriodEnd
    ? format(parseISO(tenant.currentPeriodEnd), "MMM d, yyyy")
    : format(endOfMonth(fallbackDate), "MMM d, yyyy");

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
              <span className="font-bold text-slate-900">{assetCount} billable assets</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-200">
              <span className="font-medium text-slate-700 ml-11">Price per asset</span>
              <span className="font-bold text-slate-900">${pricePerAsset}.00 / month</span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
                <h3 className="text-3xl font-bold text-slate-900">{planName}</h3>
                <p className="text-slate-500 mt-2">Billed monthly • Next billing date: {nextBillingDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Next Payment Due</p>
                <h3 className="text-3xl font-bold text-slate-900">
                  ${upcomingInvoiceAmount !== null ? upcomingInvoiceAmount.toFixed(2) : estimatedMonthlyCost.toFixed(2)}
                </h3>
                {upcomingInvoiceAmount !== null && upcomingInvoiceAmount !== estimatedMonthlyCost && (
                  <p className="text-xs text-slate-500 mt-1 max-w-[150px] ml-auto">Includes prorations & previous payments</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100">
          {(tenant?.billingStatus === "active" || tenant?.billingStatus === "trialing") && tenant?.stripeCustomerId ? (
            <Button
              onClick={handleManageSubscription}
              disabled={managing}
              className="bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all px-6 py-6 disabled:opacity-50"
            >
              {managing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Manage Subscription"
              )}
            </Button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
