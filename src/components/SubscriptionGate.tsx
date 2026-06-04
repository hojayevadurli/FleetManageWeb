import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { CreditCard, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

// Routes that are accessible even without an active subscription
const ALLOWED_PATHS = [
  "/app/settings/billing",
  "/app/settings/account",
  "/app/settings/preferences",
  "/app/settings/team",
  "/app/settings",
];

const isAllowed = (pathname: string) =>
  ALLOWED_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"));

interface Props {
  children: ReactNode;
}

const SubscriptionGate = ({ children }: Props) => {
  const { isReadOnly, isLoading, tenant } = useSubscription();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // While subscription status is loading, render normally (avoids flash)
  if (isLoading) return <>{children}</>;

  // Settings pages are always accessible so users can manage billing
  if (!isReadOnly || isAllowed(pathname)) return <>{children}</>;

  const billingStatus = tenant?.billingStatus?.toLowerCase();
  const isCancelled   = billingStatus === "canceled" || billingStatus === "cancelled";
  const isPastDue     = billingStatus === "past_due";

  const accessEndDate = tenant?.currentPeriodEnd
    ? format(parseISO(tenant.currentPeriodEnd.substring(0, 10)), "MMMM d, yyyy")
    : null;

  const heading = isCancelled
    ? "Subscription Cancelled"
    : isPastDue
    ? "Payment Failed"
    : "Subscription Required";

  const body = isCancelled
    ? accessEndDate
      ? `Your subscription was cancelled. You had full access until ${accessEndDate}. Resubscribe to continue using FleetManage.`
      : "Your subscription was cancelled. Resubscribe to continue using FleetManage."
    : isPastDue
    ? "We couldn't process your last payment. Please update your payment method to restore access."
    : "Your account doesn't have an active subscription. Subscribe to access your fleet data.";

  return (
    <div className="flex flex-1 items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full mx-auto text-center px-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-9 h-9 text-slate-400" />
        </div>

        {/* Text */}
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
          {heading}
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed mb-8">
          {body}
        </p>

        {/* CTA */}
        <Button
          onClick={() => navigate("/app/settings/billing")}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl px-8 py-6 text-sm shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
        >
          <CreditCard className="w-4 h-4" />
          {isCancelled ? "Resubscribe" : isPastDue ? "Update Payment Method" : "Manage Billing"}
          <ArrowRight className="w-4 h-4" />
        </Button>

        <p className="text-xs text-slate-400 font-medium mt-4">
          Your data is safe and will be here when you return.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionGate;
