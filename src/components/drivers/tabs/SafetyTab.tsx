import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { ShieldAlert, CheckCircle, GraduationCap, AlertTriangle, Info } from "lucide-react";

interface SafetyTabProps {
    driver: Driver;
}

export function SafetyTab({ driver }: SafetyTabProps) {
    return (
        <div className="space-y-6">
            {/* High Level Safety Score */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none relative overflow-hidden">
                    <CardContent className="p-6 relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-300 font-medium flex items-center gap-2">
                                    Safety Score
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-white rounded-full">
                                                <AlertTriangle className="h-3 w-3" />
                                                <span className="sr-only">View Breakdown</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Safety Score Breakdown</DialogTitle>
                                                <DialogDescription>
                                                    How your score of 96/100 is calculated.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Incidents (40%)</span>
                                                        <span className="font-medium text-green-600">40/40</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 w-full"></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">MVR Status (30%)</span>
                                                        <span className="font-medium text-green-600">30/30</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 w-full"></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Training (15%)</span>
                                                        <span className="font-medium text-amber-600">11/15</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-amber-500 w-[73%]"></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Document Compliance (15%)</span>
                                                        <span className="font-medium text-green-600">15/15</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 w-full"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </p>
                                <h2 className="text-5xl font-bold mt-2 text-white">96<span className="text-2xl text-gray-400 font-normal">/100</span></h2>
                                <div className="flex items-center gap-2 mt-4">
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                                        Low Risk
                                    </Badge>
                                    <span className="text-emerald-400 text-sm font-medium flex items-center">
                                        ▲ +4 last 6mo
                                    </span>
                                </div>
                            </div>
                            <ShieldAlert className="h-16 w-16 text-emerald-400 opacity-20 absolute right-4 bottom-4" />
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
                        <div className="flex items-center justify-between p-2 -mx-2 bg-amber-50 rounded-md border border-amber-100">
                            <div className="flex items-center gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <span className="text-gray-900 font-medium">Clearinghouse Query Needed</span>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-xs border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800">Run Now</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Training & Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-blue-600" />
                            Training Requirements
                        </CardTitle>
                        <span className="text-sm font-medium text-gray-500">2 of 3 Completed</span>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">Completion</span>
                                <span className="text-blue-600 font-bold">66%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-2/3"></div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <p className="font-medium text-sm text-gray-900">Winter Driving Safety</p>
                                    </div>
                                    <p className="text-xs text-gray-400 pl-5">Completed Nov 15, 2025</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        <p className="font-medium text-sm text-gray-900">Hours of Service (HOS)</p>
                                    </div>
                                    <p className="text-xs text-gray-400 pl-5">Completed Jan 10, 2026</p>
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-2 bg-amber-50/50 rounded-md px-2 -mx-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full border-2 border-amber-500"></div>
                                        <p className="font-medium text-sm text-gray-900">Hazmat Refresher</p>
                                    </div>
                                    <p className="text-xs text-amber-600 pl-5 font-medium">Due: Mar 01, 2026</p>
                                </div>
                                <Button size="sm" variant="ghost" className="h-7 text-xs text-blue-600 hover:text-blue-700 p-0">Start</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-red-600" />
                                Incident History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Last 12 Months</p>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Lifetime</p>
                                    <p className="text-2xl font-bold text-gray-900">1</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Preventable</span>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">0</Badge>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-600">Non-Preventable</span>
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">1</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Violation Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-600">Moving Violations</span>
                                    <span className="font-medium text-gray-900">0</span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-600">Logbook / HOS</span>
                                    <span className="font-medium text-gray-900">0</span>
                                </div>
                                <div className="flex justify-between items-center text-sm py-1">
                                    <span className="text-gray-600">Vehicle Maintenance</span>
                                    <span className="font-medium text-gray-900">0</span>
                                </div>
                                <div className="pt-3 mt-1 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-sm font-semibold text-gray-900">CSA Points</span>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none">0 pts</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
