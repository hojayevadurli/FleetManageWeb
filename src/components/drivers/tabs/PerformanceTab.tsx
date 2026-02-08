import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare, ThumbsUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PerformanceTabProps {
    driver: Driver;
}

export function PerformanceTab({ driver }: PerformanceTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">Performance Notes</h3>
                <Button variant="outline" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Add Note
                </Button>
            </div>

            <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <ThumbsUp className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">Exceptional Service</h4>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">Praise</Badge>
                                <span className="text-xs text-gray-400">• Jan 15, 2026</span>
                            </div>
                            <p className="text-gray-600">
                                Customer specifically mentioned {driver.firstName} for being polite and helping with the unload at the Georgia facility. Great job representing the company.
                            </p>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Logged by: Dispatch</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">Late Arrival</h4>
                                <Badge variant="secondary" className="bg-amber-50 text-amber-700">Performance</Badge>
                                <span className="text-xs text-gray-400">• Dec 02, 2025</span>
                            </div>
                            <p className="text-gray-600">
                                Arrived 2 hours late to pickup without proactive communication. Discussed with driver about calling ahead.
                            </p>
                            <p className="text-xs text-gray-400 mt-2 font-medium">Logged by: Safety Mgr</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
