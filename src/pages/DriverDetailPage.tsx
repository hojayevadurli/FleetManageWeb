import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Driver, DriverOperatingStatus, DriverHiringStage, OperatorDto, OperatorStatus, DriverComplianceStatus } from "@/lib/types";
import { operatorsApi } from "@/lib/operatorsApi";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, FileText, Shield, DollarSign, Calendar, Star, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "@/components/drivers/tabs/OverviewTab";
import { DocumentsTab } from "@/components/drivers/tabs/DocumentsTab";
import { TimeOffTab } from "@/components/drivers/tabs/TimeOffTab";
import { SpendTab } from "@/components/drivers/tabs/SpendTab";
import { SafetyTab } from "@/components/drivers/tabs/SafetyTab";
import { PerformanceTab } from "@/components/drivers/tabs/PerformanceTab";
import { AddIncidentSheet } from "@/components/drivers/AddIncidentSheet";

import { EquipmentAssignmentDialog } from "@/components/drivers/EquipmentAssignmentDialog";
import { useToast } from "@/hooks/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function DriverDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [driver, setDriver] = useState<OperatorDto | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
    const [hasEquipment, setHasEquipment] = useState(false); // Set to false to show CTA for testing
    const [assignmentRefreshKey, setAssignmentRefreshKey] = useState(0); // Add this to trigger refresh
    const [safetyRefreshKey, setSafetyRefreshKey] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAddInspection, setShowAddInspection] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            setLoading(true);
            operatorsApi.getById(id)
                .then(d => {
                    setDriver(d);
                    // Check if driver has active assignments
                    return operatorsApi.getAssignments(d.id);
                })
                .then(assignments => {
                    // Check if there are any active assignments (endAt is null)
                    const hasActiveAssignments = assignments.some(a => !a.endAt);
                    setHasEquipment(hasActiveAssignments);
                })
                .catch(err => {
                    console.error(err);
                    toast({ title: "Error", description: "Driver not found", variant: "destructive" });
                })
                .finally(() => setLoading(false));
        }
    }, [id, toast]);

    // Adapter for Legacy Tabs
    const adaptedDriver: Driver | undefined = useMemo(() => {
        if (!driver) return undefined;

        let metadata: any = {};
        try {
            if (driver.notes?.startsWith("{")) {
                const parsed = JSON.parse(driver.notes);
                if (parsed.metadata) metadata = parsed.metadata;
            }
        } catch (e) { /* ignore */ }

        // Map Status Numerics to Strings
        console.log("DetailPage Driver Data:", { id: driver.id, status: driver.status, type: typeof driver.status });
        let opStatus = DriverOperatingStatus.Active;

        const statusVal = driver.status;
        const statusNum = Number(statusVal);

        if (isNaN(statusNum)) {
            // Handle String Status from Backend (if applicable)
            const statusStr = String(statusVal).toLowerCase();
            if (statusStr === 'active') opStatus = DriverOperatingStatus.Active;
            else if (statusStr === 'inactive' || statusStr === 'suspended') opStatus = DriverOperatingStatus.Suspended; // Inactive
            else if (statusStr === 'onleave' || statusStr === 'on leave') opStatus = DriverOperatingStatus.OnLeave;
            else if (statusStr === 'terminated') opStatus = DriverOperatingStatus.Terminated;
        } else {
            // Handle Numeric Status
            switch (statusNum) {
                case OperatorStatus.Active: opStatus = DriverOperatingStatus.Active; break;
                case OperatorStatus.Inactive: opStatus = DriverOperatingStatus.Suspended; break;
                case OperatorStatus.OnLeave: opStatus = DriverOperatingStatus.OnLeave; break;
                case OperatorStatus.Terminated: opStatus = DriverOperatingStatus.Terminated; break;
                default: opStatus = DriverOperatingStatus.Active;
            }
        }

        return {
            id: driver.id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            email: driver.email || "",
            phone: driver.phone || "",
            photoUrl: driver.photoUrl,
            driverNumber: driver.employeeId || "",

            // Mapped Fields
            operatingStatus: opStatus,
            hiringStage: metadata.hiringStage || DriverHiringStage.Lead,
            isBlacklisted: metadata.isBlacklisted || false,

            // Mocked or Metadata Fields
            homeTerminal: metadata.homeTerminal || "Not Assigned",
            currentAssettNumber: "N/A", // Backend doesn't support assignment yet

            complianceStatus: DriverComplianceStatus.Good, // Default
            rating: 5.0, // Default

            hireDate: driver.hireDate || "",
            // ... other fields that might be used by tabs
            licenseNumber: driver.licenseNumber,
            licenseState: driver.licenseState,
            dlExpireDate: driver.licenseExpirationDate ? String(driver.licenseExpirationDate) : undefined,
            dlIssueDate: "", // Not in OperatorDto
            medicalCardExpiration: "",
            address: metadata.address || "",
            notes: driver.notes,
            documents: [], // We don't need to pass docs here for legacy tabs usually, unless they use it
        } as unknown as Driver;
    }, [driver]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!driver || !adaptedDriver) return <div className="p-8">Driver not found</div>;

    // Helper to get status display
    const getStatusDisplay = (d: Driver) => {
        if (d.isBlacklisted) return { text: 'Blacklisted', color: 'bg-red-600 text-white' };
        if (d.operatingStatus) {
            if (d.operatingStatus === DriverOperatingStatus.Active) return { text: 'Active', color: 'bg-emerald-500 text-white' };
            if (d.operatingStatus === DriverOperatingStatus.OnLeave) return { text: 'On Leave', color: 'bg-amber-500 text-white' };
            if (d.operatingStatus === DriverOperatingStatus.Terminated) return { text: 'Terminated', color: 'bg-red-500 text-white' };
            if (d.operatingStatus === DriverOperatingStatus.Suspended) return { text: 'Inactive', color: 'bg-gray-500 text-white' }; // Display 'Inactive' for Suspended/Inactive
            return { text: d.operatingStatus, color: 'bg-gray-500 text-white' };
        }
        if (d.hiringStage) return { text: d.hiringStage, color: 'bg-blue-500 text-white' };
        return { text: 'Unknown', color: 'bg-gray-500' };
    };

    const handleDeleteOperator = async () => {
        if (!id) return;

        console.log('Starting delete operation for operator:', id);
        setDeleting(true);
        try {
            console.log('Calling operatorsApi.delete...');
            await operatorsApi.delete(id);
            console.log('Delete successful, showing toast and navigating...');
            toast({ title: "Success", description: "Operator deleted successfully" });
            // Force a hard refresh to ensure data is reloaded
            window.location.href = '/app/drivers';
        } catch (error) {
            console.error("Failed to delete operator", error);
            toast({ title: "Error", description: "Failed to delete operator", variant: "destructive" });
        } finally {
            setDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const statusInfo = getStatusDisplay(adaptedDriver);

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
                        <p className="text-gray-500 font-mono text-sm">{driver.employeeId}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to={`/app/drivers/${id}/edit`}>
                        <Button variant="outline">Edit Driver</Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
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
                        driver={driver} // Pass OperatorDto
                        isEditing={isEditing}
                        onCancel={() => setIsEditing(false)}
                        onEdit={() => setIsEditing(true)}
                        onSave={() => {
                            setIsEditing(false);
                            if (id) operatorsApi.getById(id).then(setDriver);
                        }}
                        // Equipment Props
                        hasEquipment={hasEquipment}
                        onAssignEquipment={() => setShowAssignmentDialog(true)}
                        assignmentRefreshKey={assignmentRefreshKey}
                        onAssignmentEnded={() => {
                            if (id) {
                                operatorsApi.getAssignments(id).then(assignments => {
                                    const hasActiveAssignments = assignments.some(a => !a.endAt);
                                    setHasEquipment(hasActiveAssignments);
                                });
                            }
                        }}
                    />
                </TabsContent>

                <TabsContent value="documents">
                    <DocumentsTab driver={driver} />
                </TabsContent>


                <TabsContent value="safety">
                    <SafetyTab driver={adaptedDriver} refreshKey={safetyRefreshKey} onAddRecord={() => setShowAddInspection(true)} />
                </TabsContent>
                <TabsContent value="spend">
                    <SpendTab driver={adaptedDriver} />
                </TabsContent>
                <TabsContent value="timeoff">
                    <TimeOffTab driver={adaptedDriver} />
                </TabsContent>
                <TabsContent value="performance">
                    <PerformanceTab driver={adaptedDriver} />
                </TabsContent>
            </Tabs>

            {/* Equipment Assignment Dialog */}
            {driver && (
                <EquipmentAssignmentDialog
                    open={showAssignmentDialog}
                    onOpenChange={setShowAssignmentDialog}
                    driverId={driver.id}
                    driverName={`${driver.firstName} ${driver.lastName}`}
                    onAssignmentComplete={() => {
                        // Refresh driver data and check assignment status
                        if (id) {
                            operatorsApi.getById(id).then(setDriver);
                            operatorsApi.getAssignments(id).then(assignments => {
                                const hasActiveAssignments = assignments.some(a => !a.endAt);
                                setHasEquipment(hasActiveAssignments);
                            });
                            // Increment refresh key to trigger re-fetch in AssignedEquipmentSection
                            setAssignmentRefreshKey(prev => prev + 1);
                        }
                    }}
                />
            )}

            <AddIncidentSheet
                open={showAddInspection}
                onOpenChange={setShowAddInspection}
                driver={adaptedDriver}
                onSuccess={() => setSafetyRefreshKey(prev => prev + 1)}
            />

            {/* Delete Operator Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Operator?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {driver?.firstName} {driver?.lastName}?
                            This will mark the operator as deleted. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOperator}
                            disabled={deleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {deleting && <span className="mr-2">Deleting...</span>}
                            Delete Operator
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
