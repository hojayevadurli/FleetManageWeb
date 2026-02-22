import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { FileText, Plus, Upload, AlertCircle, ShieldCheck } from "lucide-react";

// --- Info Item ---
interface InfoItemProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
}
export const InfoItem = ({ icon, label, children }: InfoItemProps) => (
    <div className="flex items-start gap-3">
        <div className="mt-1 w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-lg shadow-sm">
            {icon}
        </div>
        <div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{label}</div>
            <div className="font-bold text-slate-900 text-sm leading-tight">{children}</div>
        </div>
    </div>
);

// --- Empty State ---
interface EmptyStateProps {
    icon?: ReactNode;
    title?: string;
    description: string;
    actions?: { label: string; onClick: () => void; variant?: "default" | "outline" | "ghost" }[];
    children?: ReactNode;
}
export const EmptyState = ({ icon, title, description, actions, children }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-slate-300">
            {icon || <FileText className="w-6 h-6" />}
        </div>
        {title && <h4 className="font-black text-slate-900 text-sm mb-1">{title}</h4>}
        <p className="text-xs text-slate-500 max-w-[200px] mb-4">{description}</p>

        <div className="flex gap-2">
            {actions ? actions.map((a, i) => (
                <Button key={i} variant={a.variant || "default"} size="sm" onClick={a.onClick}>
                    {a.label}
                </Button>
            )) : children}
        </div>
    </div>
);

// --- Service Items Table ---
interface ServiceLine {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    cost: number;
    type?: string;
    isWarrantyClaim?: boolean;
}

interface ServiceItemsListProps {
    items: ServiceLine[];
    total: number;
    tax?: number;
}

export const ServiceItemsList = ({ items, total, tax }: ServiceItemsListProps) => {
    return (
        <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow>
                        <TableHead className="w-[50%] text-[10px] font-black uppercase tracking-widest text-slate-400 pl-6">Description</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Unit Price</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right pr-6">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/50">
                            <TableCell className="pl-6 font-medium text-slate-700">
                                {item.description}
                                {item.type && <Badge variant="outline" className="ml-2 text-[10px] h-5 py-0 px-1.5 text-slate-400 border-slate-200 font-normal">{item.type}</Badge>}
                                {item.isWarrantyClaim && <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5 py-0 px-1.5 font-bold"><ShieldCheck className="w-3 h-3 mr-1 inline-block" />Warranty</Badge>}
                            </TableCell>
                            <TableCell className="text-center text-slate-600">{item.quantity}</TableCell>
                            <TableCell className="text-right text-slate-600 font-mono">${item.unitPrice?.toFixed(2)}</TableCell>
                            <TableCell className="pr-6 text-right font-bold text-slate-900 font-mono">${item.cost?.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter className="bg-slate-50 border-t border-slate-100">
                    {tax !== undefined && tax > 0 && (
                        <TableRow>
                            <TableCell colSpan={3} className="text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Tax</TableCell>
                            <TableCell className="text-right font-mono font-bold text-slate-600 pr-6">${tax.toFixed(2)}</TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell colSpan={3} className="text-right text-xs font-black text-slate-900 uppercase tracking-widest">Total</TableCell>
                        <TableCell className="text-right font-mono text-lg font-black text-slate-900 pr-6">${total.toFixed(2)}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
};
