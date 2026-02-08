import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, CheckCircle, GraduationCap, AlertTriangle } from "lucide-react";

interface SafetyTabProps {
    driver: Driver;
}

export function SafetyTab({ driver }: SafetyTabProps) {
    return (
        <div className="space-y-6">
            {/* High Level Safety Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-300 font-medium">Safety Score</p>
                                <h2 className="text-5xl font-bold mt-2 text-white">96<span className="text-2xl text-gray-400 font-normal">/100</span></h2>
                                <Badge className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                                    Low Risk
                                </Badge>
                            </div>
                            <ShieldAlert className="h-12 w-12 text-emerald-400 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Compliance Checklist</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="text-gray-700">Medical Card Valid</span>
                            </div>
                            <span className="text-xs text-gray-500">Exp: Dec 2026</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <span className="text-gray-700">MVR Clear (Last 90 days)</span>
                            </div>
                            <span className="text-xs text-gray-500">Checked: Jan 10</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <span className="text-gray-700">Clearinghouse Query Needed</span>
                            </div>
                            <Button variant="link" size="sm" className="h-auto p-0 text-blue-600">Run Now</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Training & Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                            Training Requirements
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Winter Driving Safety</p>
                                    <p className="text-xs text-gray-500">Assigned: Nov 15, 2025</p>
                                </div>
                                <Badge variant="outline" className="bg-white border-green-200 text-green-700">Completed</Badge>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-gray-900">Hazmat Refresher</p>
                                    <p className="text-xs text-gray-500">Due: Mar 01, 2026</p>
                                </div>
                                <Badge variant="outline" className="bg-white border-amber-200 text-amber-700">Pending</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-red-600" />
                            Recent Incidents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 italic">No recorded incidents in the last 12 months.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
