import React, { createContext, useContext, useEffect, useState } from "react";
import { tenantsApi, Tenant } from "@/lib/tenantsApi";
import { useAuth } from "@/components/auth/AuthContext";
import { differenceInDays, parseISO, isPast } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertCircle } from "lucide-react";
import { billingApi } from "@/lib/billingApi";

export const PAYMENT_REQUIRED_EVENT = "fleetmanage:payment-required";

interface SubscriptionContextType {
    tenant: Tenant | null;
    trialDaysLeft: number | null;
    isReadOnly: boolean;
    isLoading: boolean;
    triggerPaymentModal: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error("useSubscription must be used within a SubscriptionProvider");
    }
    return context;
};

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManagingBilling, setIsManagingBilling] = useState(false);

    // Fetch the current tenant to check its status
    useEffect(() => {
        async function loadTenantStatus() {
            if (!user) {
                setTenant(null);
                setTrialDaysLeft(null);
                setIsReadOnly(false);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const data = await tenantsApi.getCurrent();
                setTenant(data);

                const isActive = data.billingStatus?.toLowerCase() === "active";
                const isTrialing = data.billingStatus?.toLowerCase() === "trialing";

                let validTrial = false;
                let daysLeft = null;

                if (isTrialing && data.trialEndsAt) {
                    const end = parseISO(data.trialEndsAt);
                    validTrial = !isPast(end);
                    if (validTrial) {
                        const diff = differenceInDays(end, new Date());
                        daysLeft = diff > 0 ? diff : 0;
                    }
                }

                setTrialDaysLeft(daysLeft);

                // If not active and not in a valid trial, set to read-only
                if (!isActive && !validTrial) {
                    setIsReadOnly(true);
                } else {
                    setIsReadOnly(false);
                }

            } catch (error) {
                console.error("Failed to load tenant status:", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadTenantStatus();
    }, [user]);

    // Listen for the global 403 event from axios
    useEffect(() => {
        const handlePaymentRequired = () => {
            setIsModalOpen(true);
            setIsReadOnly(true); // Force read-only if the backend just caught it
        };

        window.addEventListener(PAYMENT_REQUIRED_EVENT, handlePaymentRequired);
        return () => {
            window.removeEventListener(PAYMENT_REQUIRED_EVENT, handlePaymentRequired);
        };
    }, []);

    const triggerPaymentModal = () => setIsModalOpen(true);

    const handleGoToBilling = async () => {
        setIsManagingBilling(true);
        try {
            const returnUrl = window.location.href;
            const response = await billingApi.createPortalSession(returnUrl);
            window.location.href = response.url;
        } catch (e) {
            console.error("Failed to redirect to billing:", e);
            setIsManagingBilling(false);
        }
    };

    return (
        <SubscriptionContext.Provider value={{ tenant, trialDaysLeft, isReadOnly, isLoading, triggerPaymentModal }}>
            {children}

            {/* Global Payment Required Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md w-[95%] rounded-3xl overflow-hidden p-0 border-0 shadow-2xl bg-white">
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 shadow-lg border border-white/20 relative z-10">
                            <AlertCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-white mb-2 relative z-10">
                            Subscription Inactive
                        </h2>
                        <p className="text-red-50 font-medium text-sm leading-relaxed max-w-[260px] relative z-10 opacity-90">
                            Your account is currently read-only. We couldn't process your last payment or your trial has expired.
                        </p>
                    </div>

                    <div className="p-8 pt-6 space-y-6">
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                <CreditCard className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-900 mb-1">Update Payment Method</h4>
                                <p className="text-xs text-slate-500 font-medium">Please link a valid payment method to resume adding or editing data.</p>
                            </div>
                        </div>

                        <DialogFooter className="flex-col sm:flex-col gap-3">
                            <Button
                                onClick={handleGoToBilling}
                                disabled={isManagingBilling}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 text-sm font-bold shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5"
                            >
                                {isManagingBilling ? "Opening Billing Portal..." : "Update Payment Settings"}
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => setIsModalOpen(false)}
                                className="w-full rounded-xl py-6 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                            >
                                Close for now (View Only)
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </SubscriptionContext.Provider>
    );
};
