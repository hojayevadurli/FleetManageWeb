
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import billingApi, { InvoiceDto } from "@/lib/billingApi";
import { toast } from "sonner";

export const BillingHistorySection = () => {
    const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await billingApi.getHistory();
                setInvoices(data);
            } catch (error) {
                console.error("Failed to fetch billing history:", error);
                toast.error("Failed to load payment history");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full p-8 flex justify-center items-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
            </div>
        );
    }

    if (invoices.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-slate-400" />
                        Payment History
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
                        Past invoices and receipts
                    </p>
                </div>
            </div>

            <div className="p-0">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-slate-100 hover:bg-transparent">
                            <TableHead className="font-bold text-slate-500 py-4 px-8 w-[250px]">Date</TableHead>
                            <TableHead className="font-bold text-slate-500">Amount</TableHead>
                            <TableHead className="font-bold text-slate-500">Status</TableHead>
                            <TableHead className="font-bold text-slate-500 text-right px-8">Receipt</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="px-8 py-4">
                                    <div className="font-bold text-slate-900">
                                        {format(new Date(invoice.date), "MMM d, yyyy")}
                                    </div>
                                    <div className="text-xs font-medium text-slate-500 mt-1">
                                        {invoice.number}
                                    </div>
                                </TableCell>
                                <TableCell className="font-bold text-slate-900">
                                    ${invoice.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            invoice.status === 'paid'
                                                ? "bg-green-50 text-green-700 border-green-200 uppercase tracking-widest text-[9px] font-black"
                                                : "bg-slate-50 text-slate-700 border-slate-200 uppercase tracking-widest text-[9px] font-black"
                                        }
                                    >
                                        {invoice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right px-8">
                                    {invoice.receiptUrl ? (
                                        <a
                                            href={invoice.receiptUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs group">
                                                View Receipt
                                                <ArrowUpRight className="ml-1.5 w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                                            </Button>
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 text-xs">N/A</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
