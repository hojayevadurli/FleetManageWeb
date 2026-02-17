import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OperatorContract } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { format } from "date-fns";
import { Loader2, DollarSign, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ContractHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    driverId: string;
}

export function ContractHistoryModal({ open, onOpenChange, driverId }: ContractHistoryModalProps) {
    const [contracts, setContracts] = useState<OperatorContract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open && driverId) {
            setLoading(true);
            operatorsApi.getContracts(driverId)
                .then(data => {
                    // Sort by start date desc
                    const sorted = data.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                    setContracts(sorted);
                })
                .catch(err => console.error("Failed to load contract history", err))
                .finally(() => setLoading(false));
        }
    }, [open, driverId]);

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "Present";
        return format(new Date(dateStr), "MMM d, yyyy");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Compensation History</DialogTitle>
                    <DialogDescription>
                        Historical record of employment terms and pay rates.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : contracts.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No contract history found.</p>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                            {contracts.map((contract) => (
                                <div key={contract.id} className="relative pl-8">
                                    {/* Timeline dot */}
                                    <div className={`absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white ${contract.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>

                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                                    {contract.driverRole}
                                                    {contract.isActive && <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px]">Current</Badge>}
                                                </h4>
                                                <div className="text-sm text-slate-500 flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-xl text-slate-800 flex items-center justify-end">
                                                    {contract.paymentType === 'Per Mile' && `$${contract.paymentRate}/mi`}
                                                    {contract.paymentType === 'Percentage' && `${contract.paymentRate}%`}
                                                    {contract.paymentType === 'Hourly' && `$${contract.paymentRate}/hr`}
                                                    {contract.paymentType === 'Flat Rate' && `$${contract.paymentRate}`}
                                                </div>
                                                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                                                    {contract.paymentType}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-50">
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Frequency</div>
                                                <div className="text-sm font-medium text-slate-700">{contract.payFrequency || "-"}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-400 uppercase font-bold">Driver Type</div>
                                                <div className="text-sm font-medium text-slate-700">{contract.driverType}</div>
                                            </div>
                                            {contract.grossShare !== undefined && contract.grossShare > 0 && (
                                                <div>
                                                    <div className="text-[10px] text-slate-400 uppercase font-bold">Gross Share</div>
                                                    <div className="text-sm font-medium text-slate-700">{contract.grossShare}%</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
