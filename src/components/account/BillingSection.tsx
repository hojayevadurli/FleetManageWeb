import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, Truck, Loader2, FileText, ExternalLink, Ban, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import tenantsApi, { Tenant } from "@/lib/tenantsApi";
import billingApi, { STRIPE_PRICE_ID, InvoiceDto, SubscriptionEventDto } from "@/lib/billingApi";
import equipmentApi from "@/lib/equipmentApi";
import { differenceInDays, format, parseISO, endOfMonth, startOfDay } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { EquipmentOperationalStatus } from "@/lib/types";

const BillingSection = () => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [assetCount, setAssetCount] = useState(0);
  const [upcomingInvoiceAmount, setUpcomingInvoiceAmount] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionEventDto[]>([]);
  const [managing, setManaging] = useState(false);

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

  useEffect(() => {
    const fetchTenantData = async () => {
      try {
        // Sync from Stripe first so dates/status are never stale (missed webhooks, etc.)
        await billingApi.syncSubscription().catch(() => {});

        const [tenantData, equipmentData, upcomingInvoice, invoiceHistory, subHistory] = await Promise.all([
          tenantsApi.getCurrent(),
          equipmentApi.list(),
          billingApi.getUpcomingInvoice().catch(() => null),
          billingApi.getHistory().catch(() => []),
          billingApi.getSubscriptionHistory().catch(() => [])
        ]);
        const billableAssets = equipmentData.filter(e =>
          e.operationalStatus === EquipmentOperationalStatus.Active ||
          String(e.operationalStatus) === 'Active' ||
          e.operationalStatus === EquipmentOperationalStatus.InShop ||
          String(e.operationalStatus) === 'InShop'
        );
        setTenant(tenantData);
        setAssetCount(billableAssets.length);
        setInvoices(invoiceHistory);
        setSubscriptionHistory(subHistory);
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

  const handleCheckout = async () => {
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
      const returnUrl = window.location.href;
      const response = await billingApi.createPortalSession(returnUrl);
      window.location.href = response.url;
    } catch (error: any) {
      console.error("Portal error:", error);
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

  // ── Status derivation ─────────────────────────────────────────────────────
  const billingStatus = tenant?.billingStatus?.toLowerCase();
  const isCancelled = billingStatus === "canceled" || billingStatus === "cancelled";
  const isPastDue   = billingStatus === "past_due";
  const isActive    = billingStatus === "active";
  const isTrialing  = billingStatus === "trialing";

  const trialEndDateStr = tenant?.trialEndsAt ? tenant.trialEndsAt.substring(0, 10) : null;
  const trialEndDate = trialEndDateStr ? parseISO(trialEndDateStr) : null;
  const trialDaysRemaining = trialEndDate ? differenceInDays(trialEndDate, startOfDay(new Date())) : 0;
  const isTrialActive = isTrialing && trialDaysRemaining > 0;

  const planName = tenant?.planKey === 'professional' ? 'Professional Plan' : 'Standard Plan';

  // Date labels differ by status
  const periodEndStr = tenant?.currentPeriodEnd ? tenant.currentPeriodEnd.substring(0, 10) : null;
  const periodEndDate = periodEndStr ? parseISO(periodEndStr) : null;
  const periodEndFormatted = periodEndDate ? format(periodEndDate, "MMM d, yyyy") : null;

  const dateLabel  = isCancelled ? "Access ends" : "Next billing date";
  const dateValue  = periodEndFormatted
    ?? (isTrialActive && trialEndDate ? format(trialEndDate, "MMM d, yyyy") : null)
    ?? format(endOfMonth(new Date()), "MMM d, yyyy");

  // Whether to show the portal (existing customer) vs. checkout (new)
  const hasPortalAccess = !!tenant?.stripeCustomerId && (isActive || isTrialing || isCancelled || isPastDue);

  const eventLabel = (type: string) => {
    switch (type) {
      case "subscribed":         return { label: "Subscribed",         cls: "bg-green-100 text-green-700" };
      case "resubscribed":       return { label: "Resubscribed",       cls: "bg-green-100 text-green-700" };
      case "reactivated":        return { label: "Reactivated",        cls: "bg-blue-100 text-blue-700" };
      case "cancelled":          return { label: "Cancelled",          cls: "bg-amber-100 text-amber-700" };
      case "trial_started":      return { label: "Trial Started",      cls: "bg-purple-100 text-purple-700" };
      case "payment_succeeded":  return { label: "Payment Succeeded",  cls: "bg-green-100 text-green-700" };
      case "payment_failed":     return { label: "Payment Failed",     cls: "bg-rose-100 text-rose-700" };
      case "suspended":          return { label: "Suspended",          cls: "bg-rose-100 text-rose-700" };
      default:                   return { label: type,                 cls: "bg-slate-100 text-slate-700" };
    }
  };

  // Invoice status badge styling
  const invoiceStatusClass = (status: string) => {
    if (status === 'paid')           return 'bg-green-100 text-green-700';
    if (status === 'open')           return 'bg-blue-100 text-blue-700';
    if (status === 'uncollectible')  return 'bg-rose-100 text-rose-700';
    if (status === 'void')           return 'bg-slate-100 text-slate-500';
    return 'bg-slate-100 text-slate-700';
  };

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

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ban className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900">Subscription Cancelled</h3>
              </div>
              <p className="text-amber-800 font-medium">
                Your subscription has been cancelled.
              </p>
              {periodEndFormatted && (
                <p className="text-sm text-amber-700 font-medium mt-1">
                  Full access continues until <strong>{periodEndFormatted}</strong>.
                </p>
              )}
            </div>
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-amber-200 shrink-0">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Status</p>
              <p className="font-black text-amber-600">Cancelled</p>
            </div>
          </div>
        )}

        {/* Past Due Banner */}
        {isPastDue && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-rose-900">Payment Failed</h3>
              </div>
              <p className="text-rose-800 font-medium">
                We couldn't process your last payment.
              </p>
              <p className="text-sm text-rose-700 font-medium mt-1">
                Please update your payment method to avoid losing access.
              </p>
            </div>
            <div className="bg-white/60 px-4 py-2 rounded-xl border border-rose-200 shrink-0">
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Status</p>
              <p className="font-black text-rose-600">Past Due</p>
            </div>
          </div>
        )}

        {/* Pricing / Plan Card */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
          <h3 className="font-bold text-slate-900 mb-4">
            {isCancelled ? "Your Plan (Cancelled)" : "Projected Monthly Cost"}
          </h3>

          <div className="flex flex-col gap-3">
            {/* Fleet size row — hide when cancelled since there's no next charge */}
            {!isCancelled && (
              <>
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
              </>
            )}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Current Plan</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-bold text-slate-900">{planName}</h3>
                  {isCancelled && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-black uppercase tracking-wider border border-amber-200">
                      Cancelled
                    </span>
                  )}
                  {isPastDue && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-black uppercase tracking-wider border border-rose-200">
                      Past Due
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mt-2">
                  {isCancelled
                    ? `Access ends: ${dateValue}`
                    : `Billed monthly · ${dateLabel}: ${dateValue}`}
                </p>
              </div>

              {/* Right side: hide "Next Payment" for cancelled */}
              {!isCancelled ? (
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Next Payment Due</p>
                  <h3 className="text-3xl font-bold text-slate-900">
                    ${upcomingInvoiceAmount !== null ? upcomingInvoiceAmount.toFixed(2) : estimatedMonthlyCost.toFixed(2)}
                  </h3>
                  {upcomingInvoiceAmount !== null && upcomingInvoiceAmount !== estimatedMonthlyCost && (
                    <p className="text-xs text-slate-500 mt-1 max-w-[150px] ml-auto">Includes prorations & previous payments</p>
                  )}
                </div>
              ) : (
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Next Payment</p>
                  <p className="text-slate-400 font-bold">None</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex justify-end items-center gap-4 pt-6 border-t border-slate-100">
          {isCancelled ? (
            /* Cancelled — prominent resubscribe CTA */
            <div className="flex flex-col items-end gap-2">
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 px-6 py-6 disabled:opacity-50 flex items-center gap-2"
              >
                {checkingOut ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting...</>
                ) : (
                  <><RefreshCcw className="h-4 w-4" /> Resubscribe</>
                )}
              </Button>
              <p className="text-xs text-slate-400">
                You won't be charged until your current access period ends.
              </p>
            </div>
          ) : hasPortalAccess ? (
            /* Active / trialing / past-due with existing Stripe customer */
            <Button
              onClick={handleManageSubscription}
              disabled={managing}
              className="bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 hover:text-slate-900 transition-all px-6 py-6 disabled:opacity-50"
            >
              {managing ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
              ) : (
                isPastDue ? "Update Payment Method" : "Manage Subscription"
              )}
            </Button>
          ) : (
            /* No Stripe customer yet */
            <Button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 px-6 py-6 disabled:opacity-50"
            >
              {checkingOut ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...</>
              ) : (
                "Start Subscription"
              )}
            </Button>
          )}
        </div>

        {/* Invoice History */}
        {invoices.length > 0 && (
          <div className="pt-8 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Invoice History
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">{format(parseISO(inv.date.substring(0, 10)), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3">${inv.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoiceStatusClass(inv.status)}`}>
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.receiptUrl && (
                          <a href={inv.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium flex items-center justify-end gap-1">
                            <ExternalLink className="w-4 h-4" /> View
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Subscription Event History */}
        {subscriptionHistory.length > 0 && (
          <div className="pt-8 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-slate-400" />
              Subscription History
            </h3>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptionHistory.map((ev) => {
                    const { label, cls } = eventLabel(ev.eventType);
                    return (
                      <tr key={ev.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {format(parseISO(ev.occurredAt), "MMM d, yyyy h:mm a")}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{ev.description ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {ev.amountPaid != null ? `$${ev.amountPaid.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BillingSection;
