import { useEffect, useState } from "react";
import api from "@/lib/Api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
} from "lucide-react";

interface Driver {
  id: string;
  motiveDriverId?: string;
  name: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpiry?: string;
  role?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface BackendDriver {
  id?: string | number;
  motiveDriverId?: string;
  motive_driver_id?: string;
  externalId?: string;

  name?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;

  email?: string;
  phone?: string;
  phoneNumber?: string;

  licenseNumber?: string;
  license_number?: string;
  licenseState?: string;
  license_state?: string;
  licenseExpiry?: string;
  license_expiry?: string;

  role?: string;
  status?: string;

  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

const DRIVERS_ENDPOINT = "/drivers";
const MOTIVE_SYNC_DRIVERS_ENDPOINT = "/integrations/motive/sync-drivers";

const normalizeDriver = (driver: BackendDriver): Driver => {
  const firstName = driver.firstName?.trim() || "";
  const lastName = driver.lastName?.trim() || "";
  const combinedName = `${firstName} ${lastName}`.trim();

  return {
    id: String(
      driver.id ??
      driver.motiveDriverId ??
      driver.motive_driver_id ??
      crypto.randomUUID()
    ),
    motiveDriverId:
      driver.motiveDriverId ??
      driver.motive_driver_id ??
      driver.externalId ??
      undefined,
    name: driver.name ?? driver.fullName ?? combinedName ?? "Unnamed Driver",
    email: driver.email ?? undefined,
    phone: driver.phone ?? driver.phoneNumber ?? undefined,
    licenseNumber: driver.licenseNumber ?? driver.license_number ?? undefined,
    licenseState: driver.licenseState ?? driver.license_state ?? undefined,
    licenseExpiry: driver.licenseExpiry ?? driver.license_expiry ?? undefined,
    role: driver.role ?? "Driver",
    status: driver.status ?? "active",
    createdAt: driver.createdAt ?? driver.created_at ?? undefined,
    updatedAt: driver.updatedAt ?? driver.updated_at ?? undefined,
  };
};

const DriverManager = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  const { toast } = useToast();

  const fetchDrivers = async () => {
    try {
      setLoading(true);

      const response = await api.get(DRIVERS_ENDPOINT);

      const rawDrivers: BackendDriver[] = Array.isArray(response.data)
        ? response.data
        : response.data?.drivers ?? response.data?.data ?? [];

      setDrivers(rawDrivers.map(normalizeDriver));
    } catch (error: unknown) {
      console.error("Fetch drivers error:", error);

      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrivers = async () => {
    try {
      setSyncing(true);

      toast({
        title: "Sync Started",
        description: "Starting driver synchronization with Motive...",
      });

      const response = await api.post(MOTIVE_SYNC_DRIVERS_ENDPOINT);

      toast({
        title: "Sync Completed",
        description:
          response.data?.message ||
          "Drivers were synced successfully from Motive.",
      });

      await fetchDrivers();
    } catch (error: unknown) {
      console.error("Driver sync error:", error);

      const err = error as {
        response?: {
          data?: {
            message?: string;
            title?: string;
            error?: string;
          };
        };
        message?: string;
      };

      toast({
        title: "Sync Failed",
        description:
          err.response?.data?.message ||
          err.response?.data?.title ||
          err.response?.data?.error ||
          err.message ||
          "Failed to sync drivers",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter((driver) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      driver.name.toLowerCase().includes(search) ||
      driver.email?.toLowerCase().includes(search) ||
      driver.motiveDriverId?.toLowerCase().includes(search) ||
      driver.licenseNumber?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      driver.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300";
      case "inactive":
      case "disabled":
        return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300";
      default:
        return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Not set";

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <div className="text-lg font-medium text-gray-600">
            Loading drivers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Driver Management
          </h2>
          <p className="text-gray-600">Manage drivers synced from Motive</p>
        </div>

        <Button
          onClick={handleSyncDrivers}
          disabled={syncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Drivers"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by name, email, Motive ID, or license..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-12 border-2 border-gray-200 rounded-xl">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Drivers
                </p>
                <p className="text-2xl font-bold">{drivers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Drivers
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    drivers.filter(
                      (driver) => driver.status.toLowerCase() === "active"
                    ).length
                  }
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Filtered Results
                </p>
                <p className="text-2xl font-bold">{filteredDrivers.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredDrivers.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
          <div className="text-gray-500 space-y-4">
            <Users className="h-16 w-16 mx-auto text-gray-400" />
            <div className="text-xl font-medium">
              {drivers.length === 0
                ? "No drivers synced yet"
                : "No drivers match your search"}
            </div>
            <div className="text-gray-400">
              {drivers.length === 0
                ? "Sync with Motive to import your drivers."
                : "Try adjusting your search criteria or filters."}
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card
              key={driver.id}
              className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-white overflow-hidden"
            >
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                      <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      {driver.name}
                    </CardTitle>

                    {driver.motiveDriverId && (
                      <div className="text-sm text-gray-600">
                        Motive ID: {driver.motiveDriverId}
                      </div>
                    )}
                  </div>

                  <Badge
                    className={`${getStatusColor(
                      driver.status
                    )} font-semibold px-3 py-1 rounded-full border`}
                  >
                    {driver.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {driver.email && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          Email:
                        </span>
                      </div>
                      <span className="text-sm break-all">{driver.email}</span>
                    </div>
                  )}

                  {driver.phone && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          Phone:
                        </span>
                      </div>
                      <span className="text-sm">{driver.phone}</span>
                    </div>
                  )}

                  {driver.licenseNumber && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          License:
                        </span>
                      </div>
                      <span className="text-sm font-mono">
                        {driver.licenseNumber}
                      </span>
                    </div>
                  )}

                  {driver.licenseState && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          State:
                        </span>
                      </div>
                      <span className="text-sm">{driver.licenseState}</span>
                    </div>
                  )}

                  {driver.licenseExpiry && (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">
                          Expires:
                        </span>
                      </div>
                      <span className="text-sm">
                        {formatDate(driver.licenseExpiry)}
                      </span>
                    </div>
                  )}

                  {driver.createdAt && (
                    <div className="flex items-center gap-2 pt-1 border-t">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">Added:</span>
                        <span className="text-sm font-medium">
                          {formatDate(driver.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverManager;