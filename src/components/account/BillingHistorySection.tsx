
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
    // Hidden for MVP as per user request.
    // TODO: Implement real billing history integration.
    return null;
};
