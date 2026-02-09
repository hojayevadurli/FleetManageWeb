import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    Ban
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
    const [drivers, setDrivers] = useState<OperatorDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        const loadDrivers = async () => {
            try {
                const data = await operatorsApi.getAll();
                setDrivers(data);
            } catch (error) {
                console.error("Failed to load drivers", error);
            } finally {
                setLoading(false);
            }
        };
        loadDrivers();
    }, []);

    const filteredDrivers = drivers.filter(driver => {
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

                    return (
                        <Link key={driver.id} to={`/app/drivers/${driver.id}`}>
                            <Card className="group hover:shadow-lg transition-all duration-300 border-gray-100 cursor-pointer h-full relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${driver.status === OperatorStatus.Active ? 'bg-emerald-500' :
                                    driver.status === OperatorStatus.Terminated ? 'bg-red-500' :
                                        'bg-amber-400'
                                    }`} />

                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                                <AvatarImage src={driver.photoUrl} />
                                                <AvatarFallback>{driver.firstName[0]}{driver.lastName[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {driver.firstName} {driver.lastName}
                                                </h3>
                                                {driver.employeeId && (
                                                    <p className="text-xs text-gray-500 font-mono">{driver.employeeId}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant={badgeVariant} className={badgeClass}>
                                            {badgeText}
                                        </Badge>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500">License State</span>
                                            <span className="font-medium text-gray-900">{driver.licenseState || '-'}</span>
                                        </div>
                                        <div className="flex justify-between py-1 border-b border-gray-50">
                                            <span className="text-gray-500">Hire Date</span>
                                            <span className="font-medium text-gray-900">
                                                {driver.hireDate ? new Date(driver.hireDate).toLocaleDateString() : '-'}
                                            </span>
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
