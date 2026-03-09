
import BillingSection from "@/components/account/BillingSection";
import { PaymentMethodsSection } from "@/components/account/PaymentMethodsSection";
import { BillingAddressSection } from "@/components/account/BillingAddressSection";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { AlertCircle } from "lucide-react";

const BillingTab = () => {
    const { isReadOnly } = useSubscription();

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 w-full">
            {isReadOnly && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-rose-900 mb-1">Action Required: Inactive Subscription</h4>
                        <p className="text-sm text-rose-700">
                            Your account is currently read-only because we couldn't process your last payment or your trial has expired.
                            Please pay any open invoices below or update your payment method to restore full access.
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
