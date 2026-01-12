import { CreditCard, Plus, Calendar } from "lucide-react";

export const PaymentMethodsSection = () => {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-slate-400" />
                    Payment Methods
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
                    Manage your payment details
                </p>
            </div>

            <div className="p-8 space-y-6">
                {/* No Payment Method State - Placeholder */}
                <div className="text-center py-8 px-4 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm mb-4">
                        <CreditCard className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-900">No payment method on file</h3>
                    <div className="flex items-center justify-center gap-2 text-amber-600 bg-amber-50 py-2 px-4 rounded-full w-fit mx-auto mt-3">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">Add payment before trial ends</span>
                    </div>

                    <button className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 mx-auto">
                        <Plus className="w-5 h-5" />
                        Add Payment Method
                    </button>
                </div>
            </div>
        </div>
    );
};
