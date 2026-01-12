
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const invoices = [
    {
        id: "INV-001",
        date: "Jan 1, 2026",
        amount: "$25.00",
        status: "Paid",
        period: "Jan 1, 2026 - Feb 1, 2026",
    },
    {
        id: "INV-002",
        date: "Dec 1, 2025",
        amount: "$25.00",
        status: "Paid",
        period: "Dec 1, 2025 - Jan 1, 2026",
    },
    {
        id: "INV-003",
        date: "Nov 1, 2025",
        amount: "$25.00",
        status: "Paid",
        period: "Nov 1, 2025 - Dec 1, 2025",
    },
];

export const BillingHistorySection = () => {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-slate-400" />
                        Invoices & Receipts
                    </h2>
                    <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
                        View and download your past invoices
                    </p>
                </div>
            </div>

            <div className="p-8">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="font-bold text-slate-900 w-[140px]">Date</TableHead>
                            <TableHead className="font-bold text-slate-900">Invoice ID</TableHead>
                            <TableHead className="font-bold text-slate-900">Billing Period</TableHead>
                            <TableHead className="font-bold text-slate-900">Amount</TableHead>
                            <TableHead className="font-bold text-slate-900">Status</TableHead>
                            <TableHead className="text-right font-bold text-slate-900">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id} className="hover:bg-slate-50 border-slate-100">
                                <TableCell className="font-medium text-slate-700">{invoice.date}</TableCell>
                                <TableCell className="font-bold text-slate-900">{invoice.id}</TableCell>
                                <TableCell className="text-slate-500 text-sm">{invoice.period}</TableCell>
                                <TableCell className="font-bold text-slate-900">{invoice.amount}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-3 py-1">
                                        {invoice.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
                                        <Download className="w-4 h-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
