import { OperatorDto } from "@/lib/types";
import { DriverForm } from "@/components/drivers/DriverForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Truck, Calendar, Activity, AlertTriangle, CheckCircle, Clock, MapPin, Phone, Mail, FileText, Star, TrendingUp } from "lucide-react";

interface OverviewTabProps {
    driver: OperatorDto;
    isEditing?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
}

export function OverviewTab({ driver, isEditing = false, onCancel, onSave }: OverviewTabProps) {
    if (isEditing) {
        return (
            <DriverForm
                mode="edit"
                initialData={driver}
                onCancel={onCancel}
                onSubmit={(updatedDriver) => {
                    console.log("Saved driver", updatedDriver);
                    if (onSave) onSave();
                }}
            />
        );
    }

    // Mock Data for Dashboard
    const safetyScore = 96;
    const performanceScore = 82;
    const expiringDocs = 1; // Mock expiring doc count
    const daysUntilExpiry = 12;
    const activeAlerts = [
        { id: 1, type: 'warning', text: `Medical Card expires in ${daysUntilExpiry} days` },
        { id: 2, type: 'info', text: 'Safety follow-up pending' }
    ];

    const recentActivity = [
        { id: 1, type: 'Performance', title: 'Positive Feedback from Dispatch', date: '2 days ago', status: 'Resolved' },
        { id: 2, type: 'Safety', title: 'Hard Braking Event', date: '5 days ago', status: 'Review' },
        { id: 3, type: 'HR', title: 'Rate Increase', date: '1 week ago', status: 'Approved' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. Top Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Safety Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-default border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Safety Score</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{safetyScore}/100</h3>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-full">
                                <Shield className="h-4 w-4 text-emerald-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0.5">Low Risk</Badge>
                            <span className="text-xs text-gray-400">Top 10%</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance Card */}
                <Card className={`shadow-sm hover:shadow-md transition-shadow cursor-default border-l-4 ${expiringDocs > 0 ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Compliance</p>
                                <h3 className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                                    {expiringDocs > 0 ? (
                                        <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {expiringDocs} Expiring</span>
                                    ) : (
                                        <span className="text-blue-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> All Valid</span>
                                    )}
                                </h3>
                            </div>
                            <div className={`p-2 rounded-full ${expiringDocs > 0 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                <FileText className={`h-4 w-4 ${expiringDocs > 0 ? 'text-amber-600' : 'text-blue-600'}`} />
                            </div>
                        </div>
                        <div className="mt-3">
                            {expiringDocs > 0 ? (
                                <p className="text-xs text-amber-600 font-medium">Action required in {daysUntilExpiry} days</p>
                            ) : (
                                <p className="text-xs text-gray-400">Next review: Dec 15, 2024</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Availability Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-default border-l-4 border-l-purple-500">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Availability</p>
                                <h3 className="text-xl font-bold text-gray-900 mt-1">{driver.status ? 'Active' : 'Inactive'}</h3>
                            </div>
                            <div className="p-2 bg-purple-100 rounded-full">
                                <Calendar className="h-4 w-4 text-purple-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-gray-500">Ready for dispatch</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Card */}
                <Card className="shadow-sm hover:shadow-md transition-shadow cursor-default border-l-4 border-l-indigo-500">
                    <CardContent className="p-4 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Performance</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{performanceScore}/100</h3>
                            </div>
                            <div className="p-2 bg-indigo-100 rounded-full">
                                <Activity className="h-4 w-4 text-indigo-600" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-emerald-600">
                            <TrendingUp className="h-3 w-3" />
                            <span className="text-xs font-medium">+4 pts</span>
                            <span className="text-xs text-gray-400 ml-1">last 90 days</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Operations & Details (Takes 2/3 width) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 2. Assignment & Operations Block */}
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-800">
                                <Truck className="h-4 w-4 text-gray-500" />
                                Current Assignment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Assigned Unit</p>
                                    <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-indigo-600" />
                                        Unit #1045
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Current Trailer</p>
                                    <p className="text-sm font-semibold text-gray-900">TR-5502 (Reefer)</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Assigned Dispatcher</p>
                                    <p className="text-sm font-semibold text-gray-900">Sarah Jenkins</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Home Terminal</p>
                                    <p className="text-sm font-semibold text-gray-900">{'Chicago, IL'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Last Load Date</p>
                                    <p className="text-sm font-medium text-gray-700">Oct 24, 2024</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase">Miles (MTD)</p>
                                    <p className="text-sm font-medium text-gray-700">8,450 mi</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 4. Basic Info - Redesigned */}
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-gray-800">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Driver Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm font-medium text-gray-900">{driver.phone || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Email</p>
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{driver.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Address</p>
                                        <p className="text-sm font-medium text-gray-900 max-w-[250px]">{'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">Hire Date</p>
                                        <p className="text-sm font-medium text-gray-900">{driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Shield className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs text-gray-500">License</p>
                                        <p className="text-sm font-medium text-gray-900">{driver.licenseNumber} <span className="text-gray-400 text-xs">({driver.licenseState})</span></p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column: Alerts & Activity (Takes 1/3 width) */}
                <div className="lg:col-span-1 space-y-6">

                    {/* 3. Alerts Section */}
                    <Card className="shadow-sm border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-800">
                                <AlertTriangle className="h-4 w-4" />
                                Attention Required
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {activeAlerts.length > 0 ? (
                                <div className="space-y-3 mt-2">
                                    {activeAlerts.map(alert => (
                                        <div key={alert.id} className="bg-white p-3 rounded-md border border-amber-100 shadow-sm flex gap-3 items-start">
                                            <div className={`mt-0.5 h-2 w-2 rounded-full ${alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                            <p className="text-sm text-gray-700 leading-snug">{alert.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic mt-2">No active alerts.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 5. Recent Activity Snapshot */}
                    <Card className="shadow-sm border-gray-200">
                        <CardHeader className="pb-3 border-b border-gray-50 pt-4 px-4 bg-gray-50/30">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800">
                                <Clock className="h-4 w-4 text-gray-500" />
                                Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 py-0">
                            <div className="divide-y divide-gray-50">
                                {recentActivity.map(activity => (
                                    <div key={activity.id} className="py-3 flex gap-3 items-start group hover:bg-gray-50/50 -mx-4 px-4 transition-colors">
                                        <div className="mt-1">
                                            {activity.type === 'Safety' && <div className="p-1.5 bg-red-100 rounded-md"><Shield className="h-3 w-3 text-red-600" /></div>}
                                            {activity.type === 'Performance' && <div className="p-1.5 bg-indigo-100 rounded-md"><Star className="h-3 w-3 text-indigo-600" /></div>}
                                            {activity.type === 'HR' && <div className="p-1.5 bg-blue-100 rounded-md"><FileText className="h-3 w-3 text-blue-600" /></div>}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{activity.title}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <p className="text-xs text-gray-500">{activity.date}</p>
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{activity.status}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="py-3 border-t border-gray-50 text-center">
                                <button className="text-xs text-blue-600 font-medium hover:underline">View Full Timeline</button>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
