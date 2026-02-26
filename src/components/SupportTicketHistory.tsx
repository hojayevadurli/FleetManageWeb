import { useState, useEffect } from "react";
import { format } from "date-fns";
import api from "@/lib/Api";
import { SupportTicket } from "@/types/support";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export default function SupportTicketHistory() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get('/support/history');
                setTickets(response.data);
            } catch (error) {
                console.error("Failed to fetch support ticket history", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case "open": return "default";
            case "in progress": return "secondary";
            case "closed": return "outline";
            default: return "secondary";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type.toLowerCase()) {
            case "bug": return "Bug Report";
            case "feature": return "Feature Request";
            case "rate": return "Feedback Rating";
            default: return "Other Inquiry";
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex justify-between mt-2">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="text-slate-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">No history found</h3>
                <p className="mt-1 text-sm text-slate-500">You haven't submitted any support requests yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {tickets.map((ticket) => (
                <div key={ticket.publicId} className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm transition-all hover:shadow-md hover:border-blue-200 group">
                    <div className="flex justify-between items-start mb-2 gap-4">
                        <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-slate-900 truncate">
                                {ticket.type === "rate" ? "Platform Feedback" : ticket.title}
                            </h4>
                        </div>
                        <Badge variant={getStatusBadgeVariant(ticket.status)} className="capitalize shrink-0">
                            {ticket.status}
                        </Badge>
                    </div>

                    {ticket.type === "rate" && ticket.rating && (
                        <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${star <= (ticket.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-slate-200"}`} />
                            ))}
                        </div>
                    )}

                    <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                        {ticket.description}
                    </p>

                    <div className="flex justify-between items-center text-xs font-medium text-slate-400 pt-3 border-t border-slate-100">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                            {getTypeLabel(ticket.type)}
                        </span>
                        <span>
                            {format(new Date(ticket.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
