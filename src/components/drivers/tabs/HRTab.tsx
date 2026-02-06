import { Driver } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, DollarSign, UserCheck } from "lucide-react";

interface HRTabProps {
    driver: Driver;
}

export function HRTab({ driver }: HRTabProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-gray-500" />
                            Employment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Employment Type</span>
                            <span className="font-medium">Full-Time (W2)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Pay Model</span>
                            <span className="font-medium">CPM (Cents Per Mile)</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Current Rate</span>
                            <span className="font-medium text-emerald-600 font-bold">$0.65 / mile</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Pay Frequency</span>
                            <span className="font-medium">Weekly</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-gray-500" />
                            Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Supervisor</span>
                            <span className="font-medium text-blue-600">Alex Morgan</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Dispatcher</span>
                            <span className="font-medium text-blue-600">Sarah Jenkins</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-50">
                            <span className="text-gray-500">Branch / Terminal</span>
                            <span className="font-medium">{driver.homeTerminal || 'Not assigned'}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Employment Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative border-l-2 border-gray-200 ml-3 pl-8 pb-8 space-y-8">
                        <div className="relative">
                            <div className="absolute -left-[41px] bg-green-500 h-5 w-5 rounded-full border-4 border-white shadow-sm"></div>
                            <p className="text-sm text-gray-500 mb-1">Jan 15, 2023</p>
                            <h4 className="font-bold text-gray-900">Hired as OTR Driver</h4>
                            <p className="text-gray-600 text-sm mt-1">Completed orientation and road test successfully.</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-[41px] bg-blue-500 h-5 w-5 rounded-full border-4 border-white shadow-sm"></div>
                            <p className="text-sm text-gray-500 mb-1">Jun 01, 2024</p>
                            <h4 className="font-bold text-gray-900">Rate Increase</h4>
                            <p className="text-gray-600 text-sm mt-1">Rate increased from $0.60 to $0.65 CPM based on performance review.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
