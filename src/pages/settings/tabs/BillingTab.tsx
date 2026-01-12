
import BillingSection from "@/components/account/BillingSection";
import { PaymentMethodsSection } from "@/components/account/PaymentMethodsSection";
import { BillingHistorySection } from "@/components/account/BillingHistorySection";
import { BillingAddressSection } from "@/components/account/BillingAddressSection";

const BillingTab = () => {
    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 w-full">
            <BillingSection />

            <PaymentMethodsSection />

            <BillingHistorySection />

            <BillingAddressSection />
        </div>
    );
};

export default BillingTab;
