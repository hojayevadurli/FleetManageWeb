import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    DollarSign,
    Star,
    Truck,
    UserPlus,
    Ban,
    Phone,
    Mail,
    FileText,
    Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { operatorsApi } from "@/lib/operatorsApi";
import { OperatorDto, OperatorStatus } from "@/lib/types";

export default function DriversPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [drivers, setDrivers] = useState<OperatorDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [driverAssignments, setDriverAssignments] = useState<Record<string, any>>({});

    useEffect(() => {
        const loadDrivers = async () => {
            try {
                const data = await operatorsApi.getAll();
                console.log('Raw operators data:', data);
                console.log('First driver docs:', data[0]?.documents);
                setDrivers(data);

                // Fetch assignments for all drivers
                const assignmentsMap: Record<string, any> = {};
                await Promise.all(
                    data.map(async (driver) => {
                        try {
                            const assignments = await operatorsApi.getAssignments(driver.id);
                            const activeAssignment = assignments.find(a => !a.endAt);
                            if (activeAssignment) {
                                assignmentsMap[driver.id] = activeAssignment;
                            }
                        } catch (err) {
                            console.error(`Failed to fetch assignments for driver ${driver.id}`, err);
                        }
                    })
                );
                setDriverAssignments(assignmentsMap);
            } catch (error) {
                console.error("Failed to load drivers", error);
            } finally {
                setLoading(false);
            }
        };
        loadDrivers();
    }, [refreshTrigger]); // Re-run when refreshTrigger changes

    // Check if we navigated here after a delete operation
    useEffect(() => {
        if (location.state?.reload) {
            console.log('Reload triggered from navigation state');
            setRefreshTrigger(prev => prev + 1);
            // Clear the state to prevent reload on subsequent navigations
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const filteredDrivers = drivers.filter(driver => {
        // Exclude soft-deleted operators
        if (driver.isDeleted) return false;

        const matchesSearch =
            driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (driver.employeeId && driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || driver.status === Number(statusFilter);

        return matchesSearch && matchesStatus;
    });

    // KPI Calculations
    const activeCount = drivers.filter(d => d.status === OperatorStatus.Active).length;
    // Mock compliance for now as backend doesn't support it directly yet
    const attentionCount = 0;
    const avgRating = 5.0; // Default

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading drivers...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Driver Control Center</h1>
                    <p className="text-gray-600 mt-1">Manage driver records, HR, safety, and performance.</p>
                </div>
                <Link to="/app/drivers/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
                        <Plus className="h-4 w-4" />
                        Add Driver
                    </Button>
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Drivers</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{activeCount}</p>
                        </div>
                        <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Compliance Alerts</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{attentionCount}</p>
                        </div>
                        <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{avgRating.toFixed(1)} <span className="text-sm text-gray-400 font-normal">/ 5.0</span></p>
                        </div>
                        <div className="h-10 w-10 bg-yellow-50 rounded-full flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Spend (Mo)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">$0.0k</p>
                        </div>
                        <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search drivers by name or ID..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <Filter className="h-4 w-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectGroup>
                            <SelectLabel className="flex items-center gap-2 text-emerald-600">
                                <Truck className="h-4 w-4" /> Status
                            </SelectLabel>

                            <SelectItem value={String(OperatorStatus.Active)}>Active</SelectItem>
                            <SelectItem value={String(OperatorStatus.Inactive)}>Inactive</SelectItem>
                            <SelectItem value={String(OperatorStatus.OnLeave)}>On Leave</SelectItem>
                            <SelectItem value={String(OperatorStatus.Terminated)}>Terminated</SelectItem>

                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">




                {filteredDrivers.map(driver => {
                    // Debug specific driver
                    if (driver.firstName.includes("Durli")) {
                        console.log("Durli Docs:", driver.documents);
                        console.log("Durli HireDate:", driver.hireDate);
                    }

                    // Determine badge style and text
                    let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
                    let badgeText = "Unknown"; // Default text
                    let badgeClass = "";

                    switch (driver.status) {
                        case OperatorStatus.Active:
                            badgeVariant = "default";
                            badgeClass = "bg-emerald-500 hover:bg-emerald-600";
                            badgeText = "Active";
                            break;
                        case OperatorStatus.Inactive:
                            badgeVariant = "secondary";
                            badgeClass = "bg-gray-500 hover:bg-gray-600 text-white";
                            badgeText = "Inactive";
                            break;
                        case OperatorStatus.OnLeave:
                            badgeVariant = "secondary";
                            badgeClass = "bg-amber-500 hover:bg-amber-600 text-white";
                            badgeText = "On Leave";
                            break;
                        case OperatorStatus.Terminated:
                            badgeVariant = "destructive";
                            badgeClass = "bg-red-500 hover:bg-red-600";
                            badgeText = "Terminated";
                            break;
                        default:
                            badgeVariant = "secondary";
                            badgeText = String(driver.status);
                    }

                    // Extract Document Expirations
                    // Helper to correct dates if they are ISO strings
                    const formatDate = (dateStr?: string) => {
                        if (!dateStr) return "-";
                        // Handle YYYY-MM-DD manually to avoid timezone issues
                        if (dateStr.includes('-')) {
                            // If it's a full ISO string with time "T", split on T first
                            const [year, month, day] = dateStr.split('T')[0].split('-');
                            return `${parseInt(month)}/${parseInt(day)}/${year}`;
                        }
                        return dateStr;
                    };

                    const getDocExpiration = (roleKeyword: string) => {
                        if (!driver.documents) return undefined;
                        // Find latest document matching role/kind
                        const docs = driver.documents.filter(d =>
                            (d.role && d.role.toLowerCase().includes(roleKeyword.toLowerCase())) ||
                            (d.docKind && d.docKind.toLowerCase().includes(roleKeyword.toLowerCase()))
                        );

                        if (docs.length === 0) return undefined;

                        // Sort by expiration date descending seems risky if we have old valid ones vs new ones without expiration
                        // Let's just take the one with the furthest expiration date? Or created recently? 
                        // Assuming the "Active" one is what we want, but we don't strictly enforce active/inactive on docs yet.
                        // Let's take the one with the latest expiration date.
                        docs.sort((a, b) => {
                            const dateA = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
                            const dateB = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
                            if (isNaN(dateA)) return 1;
                            if (isNaN(dateB)) return -1;
                            return dateB - dateA; // Descending
                        });

                        return docs[0]?.expirationDate;
                    };



                    const medicalExpiry = getDocExpiration("medical");
                    const mvrExpiry = getDocExpiration("mvr");
                    // Clearinghouse? 
                    const clearinghouseExpiry = getDocExpiration("clearinghouse");

                    // Check for upcoming expirations (e.g. 30 days)
                    const isExpiring = (dateStr?: string) => {
                        if (!dateStr) return false;
                        const today = new Date();
                        const exp = new Date(dateStr);
                        // Simple check, might need better date parsing if dateStr is not ISO
                        const diffTime = exp.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays < 30 && diffDays > 0;
                    };

                    const isMedicalExpiring = isExpiring(medicalExpiry);


                    return (
                        <Link key={driver.id} to={`/app/drivers/${driver.id}`}>
                            <Card className="group hover:shadow-lg transition-all duration-300 border-gray-100 cursor-pointer h-full relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${driver.status === OperatorStatus.Active ? 'bg-emerald-500' :
                                    driver.status === OperatorStatus.Terminated ? 'bg-red-500' :
                                        'bg-amber-400'
                                    }`} />

                                <CardContent className="p-5 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                <AvatarImage src={driver.photoUrl} />
                                                <AvatarFallback>{driver.firstName[0]}{driver.lastName[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden">
                                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate" title={`${driver.firstName} ${driver.lastName}`}>
                                                    {driver.firstName} {driver.lastName}
                                                </h3>
                                                {driver.employeeId && (
                                                    <p className="text-xs text-gray-500 font-mono">{driver.employeeId}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Assigned Asset Badge */}
                                            {driverAssignments[driver.id] && (
                                                <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-md border border-blue-200">
                                                    <Truck className="h-3.5 w-3.5 text-blue-600" />
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-[10px] uppercase font-semibold text-blue-600/70">Unit</span>
                                                        <span className="text-xs font-black text-blue-900">{driverAssignments[driver.id].equipmentUnitNumber}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <Badge variant={badgeVariant} className={`shrink-0 ${badgeClass}`}>
                                                {badgeText}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-xs text-gray-600 mt-1 flex-1">
                                        {/* Contact Info */}
                                        {(driver.phone || driver.email) && (
                                            <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50">
                                                {driver.phone && (
                                                    <div className="flex items-center gap-2 truncate" title={driver.phone}>
                                                        <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                                        <span>{driver.phone}</span>
                                                    </div>
                                                )}
                                                {driver.email && (
                                                    <div className="flex items-center gap-2 truncate" title={driver.email}>
                                                        <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                        <span>{driver.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Key Dates Grid */}
                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                            {/* Row 1: Legal Info */}
                                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="block text-[10px] uppercase text-gray-500 font-bold mb-1">License State</span>
                                                <span className="text-sm font-bold text-gray-900">{driver.licenseState || '-'}</span>
                                            </div>
                                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Hire Date</span>
                                                <span className="text-sm font-bold text-gray-900">{formatDate(driver.hireDate)}</span>
                                            </div>

                                            {/* Row 2: Expirations */}
                                            <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                                <span className="block text-[10px] uppercase text-blue-600/70 font-bold mb-1 flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> CDL Exp
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">{formatDate(driver.licenseExpirationDate)}</span>
                                            </div>
                                            <div className={`p-2 rounded-lg border ${isMedicalExpiring ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50/50 border-emerald-100/50'}`}>
                                                <span className={`block text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${isMedicalExpiring ? 'text-amber-600' : 'text-emerald-600/70'}`}>
                                                    <FileText className="h-3 w-3" /> Medical Exp
                                                </span>
                                                <span className={`text-sm font-bold ${isMedicalExpiring ? 'text-amber-700' : 'text-gray-900'}`}>{formatDate(medicalExpiry)}</span>
                                            </div>

                                            {/* Row 3: More Expirations */}
                                            <div className="p-2 bg-purple-50/50 rounded-lg border border-purple-100/50">
                                                <span className="block text-[10px] uppercase text-purple-600/70 font-bold mb-1 flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> MVR Exp
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">{formatDate(mvrExpiry)}</span>
                                            </div>
                                            <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                                                <span className="block text-[10px] uppercase text-indigo-600/70 font-bold mb-1 flex items-center gap-1">
                                                    <FileText className="h-3 w-3" /> Clearinghouse
                                                </span>
                                                <span className="text-sm font-bold text-gray-900">{formatDate(clearinghouseExpiry)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
