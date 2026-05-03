import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Users,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    DollarSign,
    Star,
    Truck,
    Phone,
    Mail,
    FileText,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

import { operatorsApi } from "@/lib/operatorsApi";
import { OperatorDto, OperatorStatus } from "@/lib/types";

type DriverAssignmentMap = Record<
    string,
    {
        equipmentUnitNumber?: string;
        endAt?: string | null;
    }
>;

function formatDate(dateStr?: string | null) {
    if (!dateStr) return "-";

    const dateOnly = dateStr.split("T")[0];
    const parts = dateOnly.split("-");

    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${Number(month)}/${Number(day)}/${year}`;
    }

    return dateStr;
}

function isExpiringSoon(dateStr?: string | null, days = 30) {
    if (!dateStr) return false;

    const today = new Date();
    const expiration = new Date(dateStr);

    if (Number.isNaN(expiration.getTime())) return false;

    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 && diffDays <= days;
}

function getDriverInitials(driver: OperatorDto) {
    const first = driver.firstName?.[0] ?? "";
    const last = driver.lastName?.[0] ?? "";

    return `${first}${last}`.toUpperCase() || "D";
}

function getStatusBadge(status: OperatorStatus | number) {
    switch (status) {
        case OperatorStatus.Active:
            return {
                text: "Active",
                variant: "default" as const,
                className: "bg-emerald-500 hover:bg-emerald-600",
                leftBorder: "bg-emerald-500",
            };

        case OperatorStatus.Inactive:
            return {
                text: "Inactive",
                variant: "secondary" as const,
                className: "bg-gray-500 hover:bg-gray-600 text-white",
                leftBorder: "bg-gray-400",
            };

        case OperatorStatus.OnLeave:
            return {
                text: "On Leave",
                variant: "secondary" as const,
                className: "bg-amber-500 hover:bg-amber-600 text-white",
                leftBorder: "bg-amber-400",
            };

        case OperatorStatus.Terminated:
            return {
                text: "Terminated",
                variant: "destructive" as const,
                className: "bg-red-500 hover:bg-red-600",
                leftBorder: "bg-red-500",
            };

        default:
            return {
                text: String(status),
                variant: "secondary" as const,
                className: "",
                leftBorder: "bg-gray-300",
            };
    }
}

function getDocExpiration(driver: OperatorDto, roleKeyword: string) {
    if (!driver.documents?.length) return undefined;

    const docs = driver.documents.filter((doc) => {
        const role = doc.role?.toLowerCase() ?? "";
        const kind = doc.docKind?.toLowerCase() ?? "";
        const keyword = roleKeyword.toLowerCase();

        return role.includes(keyword) || kind.includes(keyword);
    });

    if (!docs.length) return undefined;

    docs.sort((a, b) => {
        const dateA = a.expirationDate
            ? new Date(a.expirationDate).getTime()
            : 0;
        const dateB = b.expirationDate
            ? new Date(b.expirationDate).getTime()
            : 0;

        return dateB - dateA;
    });

    return docs[0]?.expirationDate;
}

export default function DriversPage() {
    const location = useLocation();

    const [drivers, setDrivers] = useState<OperatorDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [driverAssignments, setDriverAssignments] =
        useState<DriverAssignmentMap>({});

    useEffect(() => {
        const loadDrivers = async () => {
            setLoading(true);

            try {
                const data = await operatorsApi.getAll();
                setDrivers(data);

                const assignmentsMap: DriverAssignmentMap = {};

                await Promise.all(
                    data.map(async (driver) => {
                        try {
                            const assignments = await operatorsApi.getAssignments(driver.id);
                            const activeAssignment = assignments.find((a) => !a.endAt);

                            if (activeAssignment) {
                                assignmentsMap[driver.id] = activeAssignment;
                            }
                        } catch (error) {
                            console.error(
                                `Failed to fetch assignments for driver ${driver.id}`,
                                error
                            );
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
    }, [refreshTrigger]);

    useEffect(() => {
        if (location.state?.reload) {
            setRefreshTrigger((prev) => prev + 1);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const visibleDrivers = useMemo(
        () => drivers,
        [drivers]
    );

    const filteredDrivers = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase();

        return visibleDrivers.filter((driver) => {
            const fullName = `${driver.firstName ?? ""} ${driver.lastName ?? ""
                }`.toLowerCase();

            const matchesSearch =
                !normalizedSearch ||
                fullName.includes(normalizedSearch) ||
                driver.employeeId?.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                statusFilter === "all" || driver.status === Number(statusFilter);

            return matchesSearch && matchesStatus;
        });
    }, [visibleDrivers, searchTerm, statusFilter]);

    const activeCount = visibleDrivers.filter(
        (driver) => driver.status === OperatorStatus.Active
    ).length;

    const complianceAlerts = visibleDrivers.filter((driver) => {
        const medicalExpiry = getDocExpiration(driver, "medical");

        return (
            isExpiringSoon(driver.licenseExpirationDate) ||
            isExpiringSoon(medicalExpiry)
        );
    }).length;

    const avgRating = 5.0;

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">Loading drivers...</div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Driver Control Center
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage driver records, HR, safety, and performance.
                    </p>
                </div>

                <Link to="/app/drivers/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg shadow-blue-600/20">
                        <Plus className="h-4 w-4" />
                        Add Driver
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Active Drivers
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {activeCount}
                            </p>
                        </div>

                        <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-emerald-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Compliance Alerts
                            </p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">
                                {complianceAlerts}
                            </p>
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
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                                {avgRating.toFixed(1)}{" "}
                                <span className="text-sm text-gray-400 font-normal">
                                    / 5.0
                                </span>
                            </p>
                        </div>

                        <div className="h-10 w-10 bg-yellow-50 rounded-full flex items-center justify-center">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">
                                Total Spend (Mo)
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">$0.0k</p>
                        </div>

                        <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search drivers by name or ID..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
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
                                <Truck className="h-4 w-4" />
                                Status
                            </SelectLabel>

                            <SelectItem value={String(OperatorStatus.Active)}>
                                Active
                            </SelectItem>
                            <SelectItem value={String(OperatorStatus.Inactive)}>
                                Inactive
                            </SelectItem>
                            <SelectItem value={String(OperatorStatus.OnLeave)}>
                                On Leave
                            </SelectItem>
                            <SelectItem value={String(OperatorStatus.Terminated)}>
                                Terminated
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {filteredDrivers.length === 0 ? (
                <Card className="border-dashed border-gray-200">
                    <CardContent className="p-10 text-center">
                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <h3 className="font-semibold text-gray-900">No drivers found</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Try changing your search or status filter.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDrivers.map((driver) => {
                        const statusBadge = getStatusBadge(driver.status);
                        const medicalExpiry = getDocExpiration(driver, "medical");
                        const mvrExpiry = getDocExpiration(driver, "mvr");
                        const clearinghouseExpiry = getDocExpiration(
                            driver,
                            "clearinghouse"
                        );

                        const isMedicalExpiring = isExpiringSoon(medicalExpiry);
                        const assignment = driverAssignments[driver.id];

                        return (
                            <Link key={driver.id} to={`/app/drivers/${driver.id}`}>
                                <Card className="group hover:shadow-lg transition-all duration-300 border-gray-100 cursor-pointer h-full relative overflow-hidden">
                                    <div
                                        className={`absolute top-0 left-0 w-1 h-full ${statusBadge.leftBorder}`}
                                    />

                                    <CardContent className="p-5 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-4 gap-2">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                                    <AvatarImage src={driver.photoUrl ?? undefined} />
                                                    <AvatarFallback>
                                                        {getDriverInitials(driver)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="overflow-hidden min-w-0 flex-1">
                                                    <h3
                                                        className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate leading-tight"
                                                        title={`${driver.firstName} ${driver.lastName}`}
                                                    >
                                                        {driver.firstName} {driver.lastName}
                                                    </h3>

                                                    {driver.employeeId && (
                                                        <p className="text-[10px] md:text-xs text-gray-500 font-mono mt-0.5 truncate">
                                                            {driver.employeeId}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                {assignment && (
                                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                                                        <Truck className="h-3 w-3 text-blue-600" />
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[9px] uppercase font-semibold text-blue-600/70">
                                                                Unit
                                                            </span>
                                                            <span
                                                                className="text-[10px] font-black text-blue-900 truncate max-w-[50px]"
                                                                title={assignment.equipmentUnitNumber}
                                                            >
                                                                {assignment.equipmentUnitNumber}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <Badge
                                                    variant={statusBadge.variant}
                                                    className={`shrink-0 text-[9px] h-5 px-2 py-0 leading-none flex items-center ${statusBadge.className}`}
                                                >
                                                    {statusBadge.text}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-3 text-xs text-gray-600 mt-1 flex-1">
                                            {(driver.phone || driver.email) && (
                                                <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-50">
                                                    {driver.phone && (
                                                        <div
                                                            className="flex items-center gap-2 truncate"
                                                            title={driver.phone}
                                                        >
                                                            <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                                                            <span>{driver.phone}</span>
                                                        </div>
                                                    )}

                                                    {driver.email && (
                                                        <div
                                                            className="flex items-center gap-2 truncate"
                                                            title={driver.email}
                                                        >
                                                            <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                                                            <span>{driver.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-3 pt-1">
                                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <span className="block text-[10px] uppercase text-gray-500 font-bold mb-1">
                                                        License State
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {driver.licenseState || "-"}
                                                    </span>
                                                </div>

                                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                    <span className="block text-[10px] uppercase text-gray-500 font-bold mb-1">
                                                        Hire Date
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatDate(driver.hireDate)}
                                                    </span>
                                                </div>

                                                <div
                                                    className={`p-2 rounded-lg border ${isExpiringSoon(driver.licenseExpirationDate)
                                                        ? "bg-amber-50 border-amber-100"
                                                        : "bg-blue-50/50 border-blue-100/50"
                                                        }`}
                                                >
                                                    <span
                                                        className={`block text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${isExpiringSoon(driver.licenseExpirationDate)
                                                            ? "text-amber-600"
                                                            : "text-blue-600/70"
                                                            }`}
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        CDL Exp
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatDate(driver.licenseExpirationDate)}
                                                    </span>
                                                </div>

                                                <div
                                                    className={`p-2 rounded-lg border ${isMedicalExpiring
                                                        ? "bg-amber-50 border-amber-100"
                                                        : "bg-emerald-50/50 border-emerald-100/50"
                                                        }`}
                                                >
                                                    <span
                                                        className={`block text-[10px] uppercase font-bold mb-1 flex items-center gap-1 ${isMedicalExpiring
                                                            ? "text-amber-600"
                                                            : "text-emerald-600/70"
                                                            }`}
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        Medical Exp
                                                    </span>
                                                    <span
                                                        className={`text-sm font-bold ${isMedicalExpiring
                                                            ? "text-amber-700"
                                                            : "text-gray-900"
                                                            }`}
                                                    >
                                                        {formatDate(medicalExpiry)}
                                                    </span>
                                                </div>

                                                <div className="p-2 bg-purple-50/50 rounded-lg border border-purple-100/50">
                                                    <span className="block text-[10px] uppercase text-purple-600/70 font-bold mb-1 flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        MVR Exp
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatDate(mvrExpiry)}
                                                    </span>
                                                </div>

                                                <div className="p-2 bg-indigo-50/50 rounded-lg border border-indigo-100/50">
                                                    <span className="block text-[10px] uppercase text-indigo-600/70 font-bold mb-1 flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        Clearinghouse
                                                    </span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatDate(clearinghouseExpiry)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}