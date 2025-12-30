
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin
} from "lucide-react";

interface Driver {
  id: string;
  motive_driver_id: string;
  name: string;
  email?: string;
  phone?: string;
  license_number?: string;
  license_state?: string;
  license_expiry?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

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
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch drivers",
          variant: "destructive"
        });
        return;
      }

      setDrivers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncDrivers = async () => {
    setSyncing(true);
    try {
      toast({
        title: "Sync Started",
        description: "Starting driver synchronization with Motive..."
      });

      const { data, error } = await supabase.functions.invoke('motive-integration', {
        body: { action: 'sync_drivers' }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Sync Completed",
          description: data.message
        });
        await fetchDrivers(); // Refresh the list
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Driver sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync drivers",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.motive_driver_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300";
      case "inactive": return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300";
      default: return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg font-medium text-gray-600">Loading drivers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Driver Management
          </h2>
          <p className="text-gray-600">Manage drivers synced from Motive TMS</p>
        </div>
        <Button 
          onClick={handleSyncDrivers}
          disabled={syncing}
          className="flex items-center gap-2"
        >
          {syncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {syncing ? "Syncing..." : "Sync Drivers"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by name, email, or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200"
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Drivers</p>
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
                <p className="text-sm font-medium text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-green-600">
                  {drivers.filter(d => d.status === 'active').length}
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
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold">{filteredDrivers.length}</p>
              </div>
              <Filter className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Grid */}
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
            <Card key={driver.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                      <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      {driver.name}
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      Motive ID: {driver.motive_driver_id}
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(driver.status)} font-semibold px-3 py-1 rounded-full border`}>
                    {driver.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  {driver.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Email:</span>
                      </div>
                      <span className="text-sm">{driver.email}</span>
                    </div>
                  )}

                  {driver.phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Phone:</span>
                      </div>
                      <span className="text-sm">{driver.phone}</span>
                    </div>
                  )}

                  {driver.license_number && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">License:</span>
                      </div>
                      <span className="text-sm font-mono">{driver.license_number}</span>
                    </div>
                  )}

                  {driver.license_state && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">State:</span>
                      </div>
                      <span className="text-sm">{driver.license_state}</span>
                    </div>
                  )}

                  {driver.license_expiry && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Expires:</span>
                      </div>
                      <span className="text-sm">{formatDate(driver.license_expiry)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-gray-600">Added:</span>
                      <span className="text-sm font-medium">
                        {new Date(driver.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
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
