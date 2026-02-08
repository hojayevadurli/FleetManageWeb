import { useState, useEffect } from "react";
import { Driver, TimeOffRequest } from "@/lib/types";
import { driversApi } from "@/lib/driversApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Check, X, Clock } from "lucide-react";

interface TimeOffTabProps {
    driver: Driver;
}

export function TimeOffTab({ driver }: TimeOffTabProps) {
    const [requests, setRequests] = useState<TimeOffRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                const data = await driversApi.getDriverTimeOffRequests(driver.id);
                setRequests(data);
            } catch (err) {
                console.error("Failed to load time off requests", err);
            } finally {
                setLoading(false);
            }
        };
        loadRequests();
    }, [driver.id]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Time Off Requests</h3>
                    <p className="text-sm text-gray-500">Manage time off, sick leave, and vacation requests.</p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Request
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center p-8 text-gray-500">Loading requests...</div>
                ) : requests.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-8 text-center text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p>No time off requests found.</p>
                        </CardContent>
                    </Card>
                ) : (
                    requests.map(req => (
                        <Card key={req.id} className="overflow-hidden">
                            <div className="flex flex-col md:flex-row border-l-4 border-blue-500">
                                <div className="p-6 flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                {req.type}
                                                <Badge variant={
                                                    req.status === 'Approved' ? 'default' :
                                                        req.status === 'Denied' ? 'destructive' : 'secondary'
                                                } className={req.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                                                    {req.status}
                                                </Badge>
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Requested on {new Date(req.requestedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-sm font-medium bg-gray-100 px-3 py-1 rounded-lg">
                                                {new Date(req.startDate).toLocaleDateString()}  ➔  {new Date(req.endDate).toLocaleDateString()}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1 mt-1">3 days</p>
                                        </div>
                                    </div>

                                    {req.reason && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100">
                                            <span className="font-semibold text-gray-900">Reason: </span>
                                            {req.reason}
                                        </div>
                                    )}
                                </div>

                                {req.status === 'Pending' && (
                                    <div className="bg-gray-50 p-4 md:w-48 flex md:flex-col items-center justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100">
                                        <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
                                            <Check className="h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 gap-2">
                                            <X className="h-4 w-4" /> Deny
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
