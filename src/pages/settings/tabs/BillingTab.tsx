
import BillingSection from "@/components/account/BillingSection";
import { BillingAddressSection } from "@/components/account/BillingAddressSection";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AlertCircle, Ban, CreditCard } from "lucide-react";
import { format, parseISO } from "date-fns";

const BillingTab = () => {
    const { isReadOnly, tenant } = useSubscription();

    const billingStatus = tenant?.billingStatus?.toLowerCase();
    const isCancelled = billingStatus === "canceled" || billingStatus === "cancelled";
    const isPastDue   = billingStatus === "past_due";

    const accessEndDate = tenant?.currentPeriodEnd
        ? format(parseISO(tenant.currentPeriodEnd.substring(0, 10)), "MMMM d, yyyy")
        : null;

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 w-full">

            {/* Cancelled — deliberate cancellation */}
            {isCancelled && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <Ban className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1">Subscription Cancelled</h4>
                        <p className="text-sm text-amber-700">
                            Your subscription has been cancelled.
                            {accessEndDate
                                ? <> You have full access until <strong>{accessEndDate}</strong>.</>
                                : null}
                            {' '}Resubscribe below to keep your access after that date.
                        </p>
                    </div>
                </div>
            )}

            {/* Past due — payment failed */}
            {!isCancelled && isPastDue && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                    <CreditCard className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-rose-900 mb-1">Payment Failed</h4>
                        <p className="text-sm text-rose-700">
                            We couldn't process your last payment. Please update your payment method to avoid losing access.
                        </p>
                    </div>
                </div>
            )}

            {/* Generic inactive (expired trial, unknown status) */}
            {!isCancelled && !isPastDue && isReadOnly && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-rose-900 mb-1">Subscription Inactive</h4>
                        <p className="text-sm text-rose-700">
                            Your account is read-only because your trial has expired or no active subscription was found.
                            Subscribe below to restore full access.
                        </p>
                    </div>
                </div>
            )}

            <BillingSection />

            <BillingAddressSection />
        </div>
    );
};

export default BillingTab;
