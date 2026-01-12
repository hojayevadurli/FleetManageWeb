import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, Truck } from "lucide-react";
import { toast } from "sonner";

const BillingSection = () => {
  // Hardcoded for demo/trial purposes as requested
  const trialDaysRemaining = 18;
  const trialEndDate = "January 28, 2026";
  const truckCount = 5;
  const pricePerTruck = 5;
  const estimatedMonthlyCost = truckCount * pricePerTruck;

  const handleAddPaymentMethod = () => {
    toast.info("Payment method flow coming soon!");
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
              Trial ends: {trialEndDate}
            </p>
          </div>
          <div className="bg-white/50 px-4 py-2 rounded-xl border border-orange-100">
            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Status</p>
            <p className="font-black text-orange-600">Active Trial</p>
          </div>
        </div>

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
                <h3 className="text-3xl font-bold text-slate-900">Professional Plan</h3>
                <p className="text-slate-500 mt-2">Billed monthly • Next billing date: Jan 1, 2026</p>
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
            className="bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 px-6 py-6"
          >
            Add Payment Method
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BillingSection;
