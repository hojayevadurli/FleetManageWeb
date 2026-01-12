
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const BillingAddressSection = () => {
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setLoading(false);
        toast.success("Billing information updated!");
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-slate-400" />
                    Billing Information
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
                    Address and Tax information for invoices
                </p>
            </div>

            <div className="p-8">
                <form onSubmit={handleUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Company Address</Label>
                            <Input defaultValue="123 Fleet St" className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Apartment / Suite</Label>
                            <Input placeholder="Unit 100" className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">City</Label>
                            <Input defaultValue="Chicago" className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">State / Province</Label>
                            <Input defaultValue="IL" className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Postal Code</Label>
                            <Input defaultValue="60601" className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Tax ID / VAT Number (Optional)</Label>
                        <Input placeholder="e.g. US-123456789" className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700" />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            size="lg"
                            disabled={loading}
                            className="rounded-xl font-bold bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm"
                        >
                            {loading ? "Updating..." : "Update Billing Info"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
