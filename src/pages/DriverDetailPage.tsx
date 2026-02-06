import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Driver, DriverOperatingStatus, DriverHiringStage } from "@/lib/types";
import { driversApi } from "@/lib/driversApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, FileText, Shield, DollarSign, Calendar, Star, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/drivers/tabs/OverviewTab";
import { DocumentsTab } from "@/components/drivers/tabs/DocumentsTab";
import { TimeOffTab } from "@/components/drivers/tabs/TimeOffTab";
import { SpendTab } from "@/components/drivers/tabs/SpendTab";
import { SafetyTab } from "@/components/drivers/tabs/SafetyTab";
import { PerformanceTab } from "@/components/drivers/tabs/PerformanceTab";
import { HRTab } from "@/components/drivers/tabs/HRTab";

export default function DriverDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [driver, setDriver] = useState<Driver | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            driversApi.getDriverById(id).then(d => {
                setDriver(d);
                setLoading(false);
            });
        }
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!driver) return <div className="p-8">Driver not found</div>;

    // Helper to get status display
    const getStatusDisplay = (driver: Driver) => {
        if (driver.isBlacklisted) return { text: 'Blacklisted', color: 'bg-red-600 text-white' };
        if (driver.operatingStatus) {
            if (driver.operatingStatus === DriverOperatingStatus.Active) return { text: 'Active', color: 'bg-emerald-500 text-white' };
            if (driver.operatingStatus === DriverOperatingStatus.OnLeave) return { text: 'On Leave', color: 'bg-amber-500 text-white' };
            return { text: driver.operatingStatus, color: 'bg-gray-500 text-white' };
        }
        if (driver.hiringStage) return { text: driver.hiringStage, color: 'bg-blue-500 text-white' };
        return { text: 'Unknown', color: 'bg-gray-500' };
    };

    const statusInfo = driver ? getStatusDisplay(driver) : { text: '', color: '' };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/app/drivers">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                        <AvatarImage src={driver.photoUrl} />
                        <AvatarFallback className="text-xl">{driver.firstName[0]}{driver.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            {driver.firstName} {driver.lastName}
                            <Badge className={`${statusInfo.color} hover:${statusInfo.color} border-0 text-base py-1 px-3`}>
                                {statusInfo.text}
                            </Badge>
                        </h1>
                        <p className="text-gray-500 font-mono text-sm">{driver.driverNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to={`/app/drivers/${id}/edit`}>
                        <Button variant="outline">Edit Driver</Button>
                    </Link>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start h-12 bg-gray-100/50 p-1 rounded-xl mb-6 overflow-x-auto">
                    <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <User className="h-4 w-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileText className="h-4 w-4" /> Documents
                    </TabsTrigger>
                    <TabsTrigger value="hr" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Briefcase className="h-4 w-4" /> HR Record
                    </TabsTrigger>
                    <TabsTrigger value="safety" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Shield className="h-4 w-4" /> Safety
                    </TabsTrigger>
                    <TabsTrigger value="spend" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <DollarSign className="h-4 w-4" /> Spend
                    </TabsTrigger>
                    <TabsTrigger value="timeoff" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Calendar className="h-4 w-4" /> Time Off
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Star className="h-4 w-4" /> Performance
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab
                        driver={driver}
                        isEditing={isEditing}
                        onCancel={() => setIsEditing(false)}
                        onSave={() => {
                            setIsEditing(false);
                            // Refresh driver data
                            if (id) driversApi.getDriverById(id).then(setDriver);
                        }}
                    />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentsTab driver={driver} />
                </TabsContent>

                <TabsContent value="hr">
                    <HRTab driver={driver} />
                </TabsContent>
                <TabsContent value="safety">
                    <SafetyTab driver={driver} />
                </TabsContent>
                <TabsContent value="spend">
                    <SpendTab driver={driver} />
                </TabsContent>
                <TabsContent value="timeoff">
                    <TimeOffTab driver={driver} />
                </TabsContent>
                <TabsContent value="performance">
                    <PerformanceTab driver={driver} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
